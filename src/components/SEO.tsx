import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
}

export function SEO({
  title = 'RESTI CBO | Community-Led Development in Uganda',
  description = 'RESTI CBO is a community-based organization working alongside refugees and host communities in Uganda to strengthen sustainable livelihoods, resilience, and self-reliance.',
  image = '/logo.png',
  type = 'website',
}: SEOProps) {
  const { pathname } = useLocation();
  const canonicalUrl = `https://resticbo.org${pathname}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="RESTI CBO" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NGO",
              "@id": "https://resticbo.org/#organization",
              "name": "RESTI CBO",
              "alternateName": "Refugee Empowerment For Sustainable Transformation Initiative",
              "legalName": "Refugee Empowerment For Sustainable Transformation Initiative",
              "url": "https://resticbo.org",
              "logo": "https://resticbo.org/logo.png",
              "description": description,
              "image": image,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kiryandongo",
                "addressCountry": "UG"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@resticbo.org",
                "telephone": "+256 700 000 000",
                "contactType": "Donor & Community Support"
              }
            },
            {
              "@type": "WebSite",
              "@id": "https://resticbo.org/#website",
              "name": "RESTI CBO",
              "url": "https://resticbo.org",
              "publisher": {
                "@id": "https://resticbo.org/#organization"
              }
            }
          ]
        })}
      </script>
    </Helmet>
  );
}
