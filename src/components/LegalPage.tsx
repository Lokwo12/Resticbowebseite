import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Shield, Lock, FileText, Scale, Cookie } from 'lucide-react';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'refund' | 'cookies';
}

const fallbacks: Record<string, string> = {
  privacy: `RESTI (Refugee Empowerment For Sustainable Transformation Initiative) Privacy Policy
Last Updated: January 2025

1. Introduction
RESTI ("we," "our," or "the Organization") is dedicated to safeguarding the privacy and personal data of our donors, volunteers, community beneficiaries, and website visitors. This Privacy Policy outlines how we collect, utilize, protect, and handle your information in accordance with international data privacy best practices and the laws of the Republic of Uganda.

2. Information We Collect
We collect information that you voluntarily provide to us when you:
• Make a donation or pledge support (donor name, email address, phone number, billing address, and transaction amount).
• Submit volunteer or partnership applications.
• Contact us through our website contact forms, email, or live communication channels.
• Subscribe to our newsletters or impact reports.

Note on Payment Data: When you make a financial contribution through our platform, your payment card details are processed directly by certified, PCI-DSS Level 1 compliant payment gateways (such as Stripe) or secure mobile telecommunications networks (MTN Uganda, Airtel Uganda). RESTI does not store or have direct access to your credit card numbers or Mobile Money PINs.

3. How We Use Your Information
We use your information strictly for legitimate organizational purposes:
• Processing donations and issuing verifiable digital receipts and certificates.
• Communicating direct updates regarding the programs and impact funded by your contributions.
• Responding to your questions, volunteer inquiries, and partnership requests.
• Complying with statutory reporting, accounting, and nonprofit audit requirements.

4. Donor Privacy Commitment
RESTI strictly upholds donor confidentiality:
• We will never sell, trade, rent, or exchange donor contact lists or personal data with any commercial entities or outside third parties.
• Public acknowledgment of donors (such as annual report recognition) is only undertaken with your express prior consent. Anonymous donations are fully respected.

5. Data Security
We implement robust technical and organizational security protocols, including HTTPS encryption, secure cloud infrastructure, and access-controlled databases to prevent unauthorized access, alteration, or disclosure of your personal data.

6. Your Rights
You have the right to request access to the personal data we hold about you, request corrections to inaccurate records, or opt out of organizational email updates at any time.

7. Contact Us
For any inquiries regarding this Privacy Policy or your personal information, please reach out to:
RESTI (Refugee Empowerment For Sustainable Transformation Initiative)
Kiryandongo District, Uganda
Email: info@resticbo.org
Website: https://resticbo.org`,

  terms: `RESTI (Refugee Empowerment For Sustainable Transformation Initiative) Terms of Service
Last Updated: January 2025

1. Acceptance of Terms
By accessing or using the website of RESTI (Refugee Empowerment For Sustainable Transformation Initiative), located at resticbo.org, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use this site.

2. Purpose and Permitted Use
The RESTI website serves as an informational, community empowerment, and fundraising platform. You agree to use this site only for lawful humanitarian, informational, and charitable purposes. You agree not to:
• Interfere with or disrupt the security or technical integrity of our digital systems.
• Attempt to gain unauthorized access to administrative portals, databases, or donor records.
• Use our name, trademarks, or copyrighted community media without written authorization.

3. Intellectual Property & Community Media
All text, reports, organizational logos, and original media content published on this website are the intellectual property of RESTI or its community partners, protected under Ugandan and international copyright laws. High-resolution photography of community members and children is published under informed consent protocols and may not be reproduced, modified, or commercially exploited without express written permission.

4. Donations & Transparency
All financial contributions processed via this website directly support RESTI's community programs, including vocational education, digital skills, food security, and refugee protection. Donations are acknowledged promptly with digital verification. RESTI maintains transparent financial records and regular third-party audits.

5. External Links
Our website may contain links to reputable external resources (such as UN agencies, partner NGOs, or news outlets). RESTI is not responsible for the privacy practices or contents of external third-party sites.

6. Limitation of Liability
While RESTI strives to keep all web information accurate and up to date, the materials on this website are provided on an "as is" basis. RESTI shall not be liable for any indirect or incidental damages resulting from your use of, or inability to use, this website.

7. Governing Law
These Terms of Service are governed by and construed in accordance with the laws of the Republic of Uganda. Any disputes shall be subject to the exclusive jurisdiction of the competent courts of Uganda.

8. Contact Information
For inquiries regarding our terms of service, please contact:
RESTI (Refugee Empowerment For Sustainable Transformation Initiative)
Email: info@resticbo.org`,

  refund: `RESTI (Refugee Empowerment For Sustainable Transformation Initiative) Donation Refund Policy
Last Updated: January 2025

1. Policy Overview
RESTI (Refugee Empowerment For Sustainable Transformation Initiative) is a registered Community-Based Organization operating humanitarian and sustainable community programs in Uganda. As a charitable initiative, all donations are considered voluntary and non-refundable gifts once deployed to active field programs.

2. Exceptional Circumstances
We recognize that mistakes can occasionally happen during online transactions. RESTI will consider requests for donation refunds under the following specific circumstances:
• An accidental duplicate donation was processed due to technical latency or double-click.
• The donor made a clear typographical error in the donation amount (e.g., intending to donate $50 but accidentally entering $500).
• An unauthorized or fraudulent transaction was conducted using a compromised card or Mobile Money account.

3. Refund Request Window
To be eligible for an exceptional refund, the request must be submitted within fourteen (14) calendar days of the original transaction date. Once funds have been formally allocated or disbursed into humanitarian field supplies, refunds may not be possible.

4. How to Request a Refund
If you need to request a donation refund or correction:
1. Send an email to info@resticbo.org with the subject line "Donation Refund Request".
2. Include your full name, transaction date, amount, payment method (Stripe card or Mobile Money), and transaction ID / receipt number.
3. Provide a brief explanation of the error or circumstance.

5. Review and Processing
Our finance and administrative team will review your request within 3 to 5 business days. If approved, refunds are credited back to the exact original payment method used (the originating credit card or Mobile Money account). Please allow 5 to 10 banking business days for the funds to reflect on your statement, depending on your financial institution's processing cycles.`,

  cookies: `RESTI (Refugee Empowerment For Sustainable Transformation Initiative) Cookies Policy
Last Updated: January 2025

1. What Are Cookies
Cookies are small text files that are stored on your computer, tablet, or mobile device when you browse websites. They are widely used to ensure websites function properly, run securely, and deliver an optimal user experience.

2. How RESTI Uses Cookies
RESTI uses cookies and similar storage technologies exclusively for legitimate purposes:
• Essential Cookies: Necessary for security, maintaining donor session authentication, routing, and processing secure transactions without interruption.
• Functional Cookies: Remember user preferences such as selected donation frequency, preferred display currency (USD / UGX), and language selection.
• Analytics Cookies: Help us understand how visitors interact with our platform (such as most viewed programs and volunteer inquiries) so we can enhance clarity and accessibility. Analytics data is aggregated and anonymized.

3. Third-Party Cookies
When you engage with external services embedded on our site (such as Stripe for PCI-compliant credit card processing, Google Analytics, or YouTube videos documenting our field projects), these services may deploy their own third-party cookies subject to their respective privacy policies.

4. Managing Your Cookie Preferences
You can manage, restrict, or delete cookies at any time through your browser settings. Please note that disabling essential cookies may impact your ability to process donations, sign in to the Donor Portal, or submit secure forms.

5. Inquiries & Contact
If you have questions regarding our use of cookies and data privacy, please contact:
RESTI (Refugee Empowerment For Sustainable Transformation Initiative)
Kiryandongo District, Uganda
Email: info@resticbo.org
Website: https://resticbo.org`
};

export function LegalPage({ type }: LegalPageProps) {
  const [content, setContent] = useState<string>(() => fallbacks[type] || '');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const legal = data.settings?.legal;
        
        if (legal) {
          let updatedContent = '';
          if (type === 'privacy') updatedContent = legal.privacyPolicy || '';
          else if (type === 'terms') updatedContent = legal.termsOfService || '';
          else if (type === 'refund') updatedContent = legal.refundPolicy || '';
          else if (type === 'cookies') updatedContent = legal.cookiesPolicy || '';
          if (updatedContent) {
            setContent(updatedContent);
          }
        }
      } catch (err) {
        console.error('Error fetching legal settings:', err);
      }
    };
    fetchSettings();
  }, [type]);

  const titles = {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    refund: 'Refund Policy',
    cookies: 'Cookies Policy'
  };

  const icons = {
    privacy: <Lock className="text-white" size={32} />,
    terms: <FileText className="text-white" size={32} />,
    refund: <Scale className="text-white" size={32} />,
    cookies: <Cookie className="text-white" size={32} />
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 sm:pt-40 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            {icons[type]}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{titles[type]}</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Please read our {titles[type].toLowerCase()} carefully.
          </p>
        </div>
      </div>

      {/* Main Content (Overlapping Card Layout) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-4 text-base">
            {content || fallbacks[type]}
          </div>
          
          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
            <Shield size={16} className="text-emerald-600" />
            <p>If you have any questions about our {titles[type].toLowerCase()}, please contact us.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
