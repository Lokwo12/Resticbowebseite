import React, { useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { useDonationModal } from './DonationModalContext';
import { DonationExperience } from './DonationExperience';

export function DonationModal() {
  const { isOpen, close, initialMethod, initialAmount } = useDonationModal();

  // Manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="RESTI Community Donation Modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Background click to close */}
      <div className="fixed inset-0" onClick={close} />

      {/* Modal Dialog Card */}
      <div className="relative bg-stone-50 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 z-10 p-5 sm:p-8">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close donation window"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Inner Content */}
        <DonationExperience
          isModal={true}
          onClose={close}
          initialAmount={initialAmount}
          initialMethod={initialMethod}
        />
      </div>
    </div>
  );
}
