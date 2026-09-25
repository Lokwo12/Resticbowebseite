import React from 'react';

/**
 * Authentic, official payment-brand icons for RESTI CBO donation flows.
 * Uses official, verified brand assets:
 * - MTN MoMo: Official SVG asset from momodeveloper.mtn.com
 * - Airtel Money: Official SVG asset from Wikimedia Commons / Airtel Brand Archive
 * - PayPal: Official SVG logo from Wikimedia Commons / PayPal Brand Center
 * - Visa & Mastercard: Official brand assets supported by Stripe
 * - Bank Transfer: Architectural bank pillar glyph in RESTI emerald palette
 */

export interface PaymentIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function MtnMomoIcon({ className = 'h-7 w-auto', ...props }: PaymentIconProps) {
  return (
    <div className="inline-flex items-center justify-center p-1 rounded-md bg-[#FFCC00] shadow-2xs shrink-0">
      <img
        src="/assets/payment-methods/mtn-momo.svg"
        alt="MTN MoMo"
        title="MTN MoMo"
        className={`object-contain select-none ${className}`}
        loading="eager"
        decoding="async"
        width={36}
        height={24}
        {...props}
      />
    </div>
  );
}

export function AirtelMoneyIcon({ className = 'h-6 w-auto', ...props }: PaymentIconProps) {
  return (
    <div className="inline-flex items-center justify-center p-1 rounded-md bg-white border border-rose-100 shadow-2xs shrink-0">
      <img
        src="/assets/payment-methods/airtel.svg"
        alt="Airtel Money"
        title="Airtel Money"
        className={`object-contain select-none ${className}`}
        loading="eager"
        decoding="async"
        width={32}
        height={24}
        {...props}
      />
    </div>
  );
}

export function PayPalIcon({ className = 'h-5 w-auto', ...props }: PaymentIconProps) {
  return (
    <div className="inline-flex items-center justify-center px-1.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs shrink-0">
      <img
        src="/assets/payment-methods/paypal.svg"
        alt="PayPal"
        title="PayPal"
        className={`object-contain select-none ${className}`}
        loading="eager"
        decoding="async"
        width={60}
        height={18}
        {...props}
      />
    </div>
  );
}

export function VisaIcon({ className = 'h-3.5 w-auto', ...props }: PaymentIconProps) {
  return (
    <img
      src="/assets/payment-methods/visa.svg"
      alt="Visa"
      title="Visa"
      className={`object-contain select-none ${className}`}
      loading="eager"
      decoding="async"
      width={36}
      height={14}
      {...props}
    />
  );
}

export function MastercardIcon({ className = 'h-4 w-auto', ...props }: PaymentIconProps) {
  return (
    <img
      src="/assets/payment-methods/mastercard.svg"
      alt="Mastercard"
      title="Mastercard"
      className={`object-contain select-none ${className}`}
      loading="eager"
      decoding="async"
      width={28}
      height={18}
      {...props}
    />
  );
}

export function CardPaymentIcon({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs shrink-0 ${className || ''}`}>
      <VisaIcon className="h-3 w-auto" />
      <div className="h-3 w-px bg-slate-200" aria-hidden="true" />
      <MastercardIcon className="h-3.5 w-auto" />
    </div>
  );
}

export function BankTransferIcon({ className = 'h-5 w-5 text-emerald-800' }: { className?: string }) {
  return (
    <div className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        width={20}
        height={20}
      >
        <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 2L2 7h20L12 2z" />
      </svg>
    </div>
  );
}
