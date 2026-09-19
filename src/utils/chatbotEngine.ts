export interface BotReply {
  text: string;
  quickReplies?: string[];
  link?: {
    text: string;
    url: string;
  };
}

export const INITIAL_QUICK_REPLIES = [
  '💚 How to Donate',
  '📚 Our Programs',
  '🌟 Opportunities',
  '📍 Location & Contact',
  '📊 Impact & Reports',
  '🙋 Speak to Staff'
];

export function generateBotReply(rawMessage: string): BotReply {
  const msg = rawMessage.toLowerCase().trim();

  // 1. GREETINGS
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|hola|jambo)/i.test(msg) || msg === 'hi' || msg === 'hello') {
    return {
      text: "Hello and welcome to RESTI CBO! 👋 We are a community-based organization serving refugees and host families in Kiryandongo District, Uganda. How can I assist you today?",
      quickReplies: ['💚 How to Donate', '📚 Our Programs', '🌟 Opportunities', '📍 Where We Work']
    };
  }

  // 2. DONATION / GIVING
  if (
    msg.includes('donate') || msg.includes('donation') || msg.includes('giving') || 
    msg.includes('contribute') || msg.includes('momo') || msg.includes('mtn') || 
    msg.includes('airtel') || msg.includes('mobile money') || msg.includes('card') || 
    msg.includes('paypal') || msg.includes('tax') || msg.includes('receipt') ||
    msg.includes('give') || msg.includes('support us') || msg.includes('sponsor')
  ) {
    return {
      text: "Thank you for your generosity! 💚 Every contribution directly empowers vulnerable refugee and host families in Kiryandongo.\n\nWays to donate:\n• 📱 Mobile Money: Direct MTN MoMo & Airtel Money in Uganda\n• 💳 Online Card & PayPal: Secure international card payments\n• 🏦 Bank Wire: Available for institutional grants and larger gifts\n\nOver 90% of all contributions go directly into field projects.",
      link: { text: 'Make a Secure Donation →', url: '/donate' },
      quickReplies: ['📊 How Funds Are Used', '📚 View Programs', '🙋 Speak to Staff']
    };
  }

  // 3. PROGRAMS & FOCUS AREAS
  if (
    msg.includes('program') || msg.includes('project') || msg.includes('livelihood') || 
    msg.includes('wash') || msg.includes('water') || msg.includes('borehole') || 
    msg.includes('education') || msg.includes('school') || msg.includes('health') || 
    msg.includes('tailoring') || msg.includes('vsla') || msg.includes('savings') || 
    msg.includes('youth') || msg.includes('women') || msg.includes('what do you do') ||
    msg.includes('activities') || msg.includes('work')
  ) {
    return {
      text: "RESTI operates 6 community-led flagship programs in Kiryandongo District:\n\n1. 🌾 Sustainable Livelihoods & VSLA: Micro-capital, seed funds & climate agriculture\n2. 🎓 Education & Youth Literacy: School bursaries, scholastic materials & digital lab\n3. 💧 Clean Water & WASH: Restoring deep community boreholes & hygiene stations\n4. 🩺 Healthcare & Outreach: Mobile clinic days and maternal health guidance\n5. 🛡️ Protection & Peacebuilding: Psychosocial counseling & coexistence dialogues\n6. ⚽ Youth Leadership & Sports: Vocational toolkits & peace leagues",
      link: { text: 'Explore All Programs →', url: '/programs' },
      quickReplies: ['💧 Water & Boreholes', '🌾 VSLA Savings', '💚 Support a Program']
    };
  }

  // 4. PARTNERSHIPS & COLLABORATION
  if (
    msg.includes('partner') || msg.includes('join') || msg.includes('collaborate') || 
    msg.includes('work with') || msg.includes('support') || msg.includes('opportunity')
  ) {
    return {
      text: "We would love to collaborate with you! 🤝 We welcome community partners, institutional donors, and collaborative organizations.\n\nKey areas of engagement:\n• 👥 Community Programs & Direct Livelihood Initiatives\n• 🌾 Climate Agriculture & Sustainable Beekeeping\n• 💧 WASH & Community Water Infrastructure\n• 📋 Monitoring, Evaluation & Strategic Research",
      link: { text: 'Contact Our Team →', url: '/contact' },
      quickReplies: ['📍 Our Locations', '📚 Our Programs', '💬 Speak to Staff']
    };
  }

  // 5. LOCATION, OFFICES & CONTACT
  if (
    msg.includes('where') || msg.includes('location') || msg.includes('office') || 
    msg.includes('address') || msg.includes('kiryandongo') || msg.includes('bweyale') || 
    msg.includes('phone') || msg.includes('call') || msg.includes('email') || 
    msg.includes('whatsapp') || msg.includes('hours') || msg.includes('contact') ||
    msg.includes('reach you') || msg.includes('located')
  ) {
    return {
      text: "Here is how you can reach or visit RESTI CBO:\n\n📍 Headquarters: Bweyale Town, Kiryandongo District, Uganda\n🌍 Field Clusters: Ranch 1, Ranch 37, Bweyale Host Communities & Panyadoli Hills\n📞 Phone: +256 772 123 456\n📧 Email: info@resticbo.org\n⏰ Hours: Monday to Friday, 8:30 AM – 5:00 PM EAT",
      link: { text: 'Get in Touch →', url: '/about' },
      quickReplies: ['💬 Leave a Message', '📚 Our Programs', '💚 Support Us']
    };
  }

  // 6. IMPACT, AUDITS & ANNUAL REPORTS
  if (
    msg.includes('impact') || msg.includes('report') || msg.includes('audit') || 
    msg.includes('numbers') || msg.includes('stats') || msg.includes('financial') || 
    msg.includes('transparency') || msg.includes('how many') || msg.includes('results') ||
    msg.includes('annual report') || msg.includes('cpa')
  ) {
    return {
      text: "Radical transparency is our core commitment! 📊\n\n• 24,850+ People directly empowered\n• 6 Core flagship programs operational\n• 145+ Active community leaders on the ground\n• 18 Settlement zones and villages served\n• 90% Program spend efficiency\n\nAll annual reports and external CPA audits are 100% public for download.",
      link: { text: 'View Impact Dashboard →', url: '/impact-dashboard' },
      quickReplies: ['📄 Download Annual Reports', '💚 Make a Donation', '📍 Settlement Zones']
    };
  }

  // 7. WHO WE ARE / ABOUT / REGISTRATION
  if (
    msg.includes('who are you') || msg.includes('what is resti') || msg.includes('about') || 
    msg.includes('cbo') || msg.includes('ngo') || msg.includes('registered') || 
    msg.includes('mission') || msg.includes('vision') || msg.includes('founded') ||
    msg.includes('history')
  ) {
    return {
      text: "Refugee Empowerment For Sustainable Transformation Initiative (RESTI) is a registered Community-Based Organization certified under the Uganda NGO Bureau. 🏛️\n\nFounded by local community leaders and refugees, we build self-reliance, economic resilience, and peaceful coexistence across Kiryandongo District.",
      link: { text: 'Read Our Story →', url: '/about' },
      quickReplies: ['📚 Our Programs', '📊 Verified Impact', '🤝 Partner With Us']
    };
  }

  // 8. TALK TO HUMAN / STAFF
  if (
    msg.includes('human') || msg.includes('person') || msg.includes('agent') || 
    msg.includes('staff') || msg.includes('representative') || msg.includes('speak to') || 
    msg.includes('talk to') || msg.includes('leave a message')
  ) {
    return {
      text: "I would be happy to connect you with our field team in Kiryandongo! 🙋\n\nPlease type your email address or phone number and a short summary of your inquiry. Our team will review your message and reply back within 24 hours.",
      quickReplies: ['📍 Office Location', '📧 info@resticbo.org', '📞 Call Now']
    };
  }

  // 9. GRATITUDE / FAREWELL
  if (
    msg.includes('thank') || msg.includes('thanks') || msg.includes('bye') || 
    msg.includes('goodbye') || msg.includes('cheers') || msg.includes('awesome') || 
    msg.includes('great') || msg.includes('ok') || msg.includes('cool')
  ) {
    return {
      text: "You are most welcome! 💚 Thank you for being interested in our work at RESTI CBO. Together we are transforming lives in Kiryandongo. Reach out anytime!",
      quickReplies: ['💚 Donate', '📚 Explore Programs', '👋 Start New Chat']
    };
  }

  // 10. DEFAULT HELPFUL FALLBACK
  return {
    text: "Thank you for your message! To help you best, here are quick shortcuts, or you can leave your email and question so our team can follow up with you directly. 🤝",
    quickReplies: [
      '💚 How to Donate',
      '📚 Our Programs',
      '🤝 Partner With Us',
      '📍 Location & Contact',
      '📊 Impact & Reports'
    ]
  };
}
