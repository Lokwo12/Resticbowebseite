import { MessageCircle, Phone, Mail, X } from 'lucide-react';
import { useState } from 'react';

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/256XXXXXXXXX', // Replace with actual WhatsApp number
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Phone,
      label: 'Call Us',
      href: 'tel:+256XXXXXXXXX', // Replace with actual phone number
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Mail,
      label: 'Email',
      href: 'mailto:info@restikirya.org',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="fixed bottom-8 left-8 z-40">
      {/* Contact Options */}
      <div
        className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {contactOptions.map((option, index) => (
          <a
            key={index}
            href={option.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${option.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
            aria-label={option.label}
          >
            <option.icon size={20} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
              {option.label}
            </span>
          </a>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-label={isOpen ? 'Close contact menu' : 'Open contact menu'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
