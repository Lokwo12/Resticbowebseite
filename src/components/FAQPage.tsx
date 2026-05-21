import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const faqsData = data.faqs || [];
        
        // Map data if needed
        const mappedFaqs = faqsData.map((item: any) => ({
          id: item.key || item.id || '',
          question: item.value?.question || item.question || '',
          answer: item.value?.answer || item.answer || '',
          category: item.value?.category || item.category || 'General',
        }));
        
        setFaqs(mappedFaqs);
      } catch (err) {
        console.error('Error fetching faqs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const fallbackFaqs: FAQ[] = [
    {
      id: '1',
      question: 'What is Resti Kiryandongo CBO?',
      answer: 'Resti Kiryandongo CBO is a Community Based Organization dedicated to empowering youth, supporting families, and promoting sustainable development in Kiryandongo district.',
      category: 'General'
    },
    {
      id: '2',
      question: 'How can I donate to the organization?',
      answer: 'You can donate via our secure online donation form using credit/debit cards, PayPal, or Mobile Money (MTN & Airtel). Visit the Donate section on our homepage.',
      category: 'Donations'
    },
    {
      id: '3',
      question: 'Are my donations tax-deductible?',
      answer: 'As a local CBO, tax deductibility depends on your country of residence. Please contact us directly to receive a formal donation receipt if needed.',
      category: 'Donations'
    },
    {
      id: '4',
      question: 'How can I become a volunteer?',
      answer: 'You can apply by filling out the form on our Volunteer page. We welcome skills in teaching, healthcare, IT, event planning, and more.',
      category: 'Volunteering'
    }
  ];

  const displayFaqs = faqs.length > 0 ? faqs : fallbackFaqs;

  const filteredFaqs = displayFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 sm:pt-40 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6 animate-float">
            <HelpCircle className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Frequently Asked Questions</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Find answers to common questions about our organization, programs, and how you can get involved.
          </p>
        </div>
      </div>

      {/* Main Content (Accordion Layout) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow focus:outline-none text-gray-700 text-base"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No results found for "{searchQuery}".
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFaqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className="border-b border-gray-100 last:border-b-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex justify-between items-center p-6 text-left hover:bg-emerald-50/50 transition-colors duration-300"
                  >
                    <div>
                      {faq.category && (
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 block">
                          {faq.category}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    </div>
                    <div className="ml-4 text-gray-400 flex-shrink-0">
                      {openId === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  
                  {openId === faq.id && (
                    <div className="p-6 pt-0 bg-gray-50/50">
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
