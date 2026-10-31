import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ShieldCheck, Printer } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const LEGAL_SLUG_MAP: Record<string, { title: string; field: 'privacyPolicy' | 'termsOfService' | 'refundPolicy' | 'cookiesPolicy' }> = {
  'privacy-policy': { title: 'Privacy Policy', field: 'privacyPolicy' },
  'privacy': { title: 'Privacy Policy', field: 'privacyPolicy' },
  'terms-of-service': { title: 'Terms of Service', field: 'termsOfService' },
  'terms': { title: 'Terms of Service', field: 'termsOfService' },
  'refund-policy': { title: 'Refund Policy', field: 'refundPolicy' },
  'refund': { title: 'Refund Policy', field: 'refundPolicy' },
  'cookies-policy': { title: 'Cookies Policy', field: 'cookiesPolicy' },
  'cookies': { title: 'Cookies Policy', field: 'cookiesPolicy' },
};

function formatRawLegalText(title: string, text: string): string {
  if (!text) return '';
  if (text.includes('<p>') || text.includes('<h2>') || text.includes('<div>')) {
    return text;
  }
  const lines = text.split('\n');
  const parts: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        parts.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        parts.push('<ul class="list-disc pl-6 space-y-2 mb-4">');
        inList = true;
      }
      const item = line.slice(2).trim();
      parts.push(`<li>${item}</li>`);
      continue;
    }

    if (inList) {
      parts.push('</ul>');
      inList = false;
    }

    if (/^\d+\.\s+[A-Za-z]/.test(line)) {
      parts.push(`<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${line}</h2>`);
    } else if (line.endsWith(':') && line.length < 80) {
      parts.push(`<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3">${line}</h3>`);
    } else {
      parts.push(`<p class="mb-4 leading-relaxed">${line}</p>`);
    }
  }

  if (inList) {
    parts.push('</ul>');
  }

  return parts.join('\n');
}

export function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      setLoading(true);
      const cleanSlug = (slug || '').toLowerCase().trim();
      const legalMeta = LEGAL_SLUG_MAP[cleanSlug];

      try {
        // 1. First attempt: Edge Function pages API
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages/${cleanSlug}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.page && data.page.published) {
            // Check if page content is substantial
            if (data.page.content && data.page.content.length > 300) {
              if (isMounted) {
                setPage(data.page);
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Edge function page fetch error, falling back to direct database:', err);
      }

      // 2. Fallback: Query Supabase PostgreSQL 'pages' table
      try {
        const { data: dbPage, error: dbErr } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', cleanSlug)
          .eq('published', true)
          .single();

        if (!dbErr && dbPage && dbPage.content && dbPage.content.length > 300) {
          if (isMounted) {
            setPage({
              id: dbPage.id,
              title: dbPage.title,
              slug: dbPage.slug,
              content: dbPage.content,
              published: dbPage.published,
              createdAt: dbPage.created_at,
              updatedAt: dbPage.updated_at,
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase pages table query error:', err);
      }

      // 3. Fallback: Query KV store for page:*
      try {
        const { data: kvPages, error: kvErr } = await supabase
          .from('kv_store_2a4be611')
          .select('key, value')
          .like('key', 'page:%');

        if (!kvErr && Array.isArray(kvPages)) {
          const match = kvPages.find((p) => p.value?.slug === cleanSlug);
          if (match && match.value?.published && match.value?.content && match.value.content.length > 300) {
            if (isMounted) {
              setPage({
                id: match.key,
                title: match.value.title,
                slug: match.value.slug,
                content: match.value.content,
                published: match.value.published,
                createdAt: match.value.createdAt || new Date().toISOString(),
                updatedAt: match.value.updatedAt || new Date().toISOString(),
              });
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Supabase KV store query error:', err);
      }

      // 4. Fallback for Legal Pages: Load official policy directly from site_settings.legal
      if (legalMeta) {
        try {
          const { data: settingsRow } = await supabase
            .from('kv_store_2a4be611')
            .select('value')
            .eq('key', 'site_settings')
            .single();

          const legal = settingsRow?.value?.legal || {};
          const legalText = legal[legalMeta.field];

          if (legalText && legalText.length > 100) {
            const formatted = formatRawLegalText(legalMeta.title, legalText);
            if (isMounted) {
              setPage({
                id: `legal:${cleanSlug}`,
                title: legalMeta.title,
                slug: cleanSlug,
                content: formatted,
                published: true,
                createdAt: '2026-05-29T21:55:06.000Z',
                updatedAt: new Date().toISOString(),
              });
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching site_settings legal fallback:', err);
        }
      }

      if (isMounted) {
        setPage(null);
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-8" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-8 md:p-12 space-y-6">
            <div className="h-10 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-3 pt-6">
              <div className="h-4 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <Helmet>
          <title>Page Not Found | RESTI CBO</title>
        </Helmet>
        <div className="max-w-md mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4 font-bold">Page Not Found</h2>
          <p className="text-gray-600 mb-8">The page you are looking for does not exist or has been removed.</p>
          <Link to="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <ArrowLeft size={18} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
      <Helmet>
        <title>{page.title} | RESTI CBO</title>
        <meta name="description" content={`Official ${page.title} for RESTI CBO (Refugee Empowerment For Sustainable Transformation Initiative).`} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors font-medium text-sm">
            <ArrowLeft size={18} className="mr-2" />
            Back to Home
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm print:hidden"
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span>Print Document</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-8 md:p-12">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <ShieldCheck size={14} /> Official Policy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Last updated on {new Date(page.updatedAt || page.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Dynamic HTML Content */}
          <div 
            className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-base sm:text-lg body-justify"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Footer note */}
          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <p>For questions regarding this policy or our operations, contact us at <a href="mailto:info@resticbo.org" className="text-emerald-600 hover:underline">info@resticbo.org</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
