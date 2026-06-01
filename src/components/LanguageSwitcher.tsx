import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh-CN', name: '中文' },
];

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  // Load saved language if any from cookie (googtrans)
  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/(.*?)(;|$)/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    setIsOpen(false);
    
    // Find the hidden Google Translate select element
    const gtSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (gtSelect) {
      gtSelect.value = langCode;
      gtSelect.dispatchEvent(new Event('change'));
    }
  };

  const currentLangName = languages.find(l => l.code === currentLang)?.name || 'English';

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
        aria-label="Change Language"
      >
        <Globe size={18} className="text-emerald-600" />
        <span className="text-sm font-medium hidden sm:inline-block">{currentLangName}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-emerald-50 ${
                    currentLang === lang.code 
                      ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                      : 'text-slate-700'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
