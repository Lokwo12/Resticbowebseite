export interface BotReply {
  text: string;
  quickReplies?: string[];
  link?: {
    text: string;
    url: string;
  };
}

export const INITIAL_QUICK_ACTIONS = [
  'About RESTI',
  'Our Programs',
  'Resources',
  'Donate',
  'Events',
  'Contact Us'
];

export const WELCOME_MESSAGE_TEXT = 
  "Hello! 👋 I'm the RESTI Assistant.\n\n" +
  "I can help you learn about RESTI, our programs, resources, events, donations, and how to get in touch with us.\n\n" +
  "How can I help you today?";

export function generateBotReply(rawMessage: string): BotReply {
  const msg = rawMessage.toLowerCase().trim();

  // 1. MAIN MENU / RESTART
  if (
    msg === 'main menu' || msg === 'menu' || msg === 'start over' || 
    msg === 'home' || msg === 'restart' || msg === 'back'
  ) {
    return {
      text: "Here are the main topics I can help you with:",
      quickReplies: INITIAL_QUICK_ACTIONS
    };
  }

  // 2. GREETINGS
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|greetings|jambo|habari)/i.test(msg) ||
    msg === 'hi' || msg === 'hello' || msg === 'hey'
  ) {
    return {
      text: "Hello! 👋 Welcome to RESTI CBO Kiryandongo. How can I help you today?",
      quickReplies: INITIAL_QUICK_ACTIONS
    };
  }

  // 3. ABOUT RESTI
  if (
    msg.includes('about resti') || msg.includes('who are you') || msg.includes('what is resti') ||
    msg.includes('about us') || msg.includes('who we are') || msg.includes('mission') ||
    msg.includes('vision') || msg.includes('registered') || msg.includes('cbo') ||
    msg.includes('organization') || msg.includes('history')
  ) {
    return {
      text: "RESTI (Refugee Empowerment For Sustainable Transformation Initiative) is a registered Community-Based Organization in Kiryandongo District, Uganda.\n\nWe build resilience, sustainable livelihoods, and social cohesion among refugees and host communities.",
      link: { text: 'Read Our Story →', url: '/about' },
      quickReplies: ['Our Programs', 'Resources', 'Contact Us', 'Main Menu']
    };
  }

  // 4. SPECIFIC PROGRAM: WASH
  if (
    msg.includes('wash') || msg.includes('clean water') || msg.includes('borehole') || 
    msg.includes('sanitation') || msg.includes('hygiene') || msg.includes('water well')
  ) {
    return {
      text: "💧 Clean Water & WASH:\n\nRESTI restores deep community boreholes, constructs dignified sanitation facilities, and trains local community water management committees across Kiryandongo.",
      link: { text: 'Explore WASH Initiatives →', url: '/programs' },
      quickReplies: ['Livelihoods', 'Environment', 'Our Programs', 'Main Menu']
    };
  }

  // 5. SPECIFIC PROGRAM: LIVELIHOODS
  if (
    msg.includes('livelihood') || msg.includes('skills') || 
    msg.includes('vsla') || msg.includes('savings') || msg.includes('agriculture') || 
    msg.includes('farming') || msg.includes('beekeeping') || msg.includes('enterprise')
  ) {
    return {
      text: "🌱 Livelihoods & Skills Development:\n\nWe support Village Savings and Loan Associations (VSLA), climate-resilient farming, modern beekeeping, and vocational skills training to foster sustainable self-reliance.",
      link: { text: 'Explore Livelihood Programs →', url: '/programs' },
      quickReplies: ['WASH', 'Environment', 'Our Programs', 'Main Menu']
    };
  }

  // 6. SPECIFIC PROGRAM: ENVIRONMENT & CLIMATE
  if (
    msg.includes('environment') || msg.includes('climate') || 
    msg.includes('tree') || msg.includes('conservation') || msg.includes('energy') || 
    msg.includes('forestry')
  ) {
    return {
      text: "🌍 Environmental Sustainability & Climate Resilience:\n\nRESTI manages indigenous tree nurseries, leads community reforestation campaigns, and promotes energy-saving cookstoves to protect local ecosystems.",
      link: { text: 'Explore Environmental Work →', url: '/programs' },
      quickReplies: ['WASH', 'Livelihoods', 'Our Programs', 'Main Menu']
    };
  }

  // 7. SPECIFIC PROGRAM: COMMUNITY DEVELOPMENT / SOCIAL COHESION
  if (
    msg.includes('community development') || msg === 'community' || msg.includes('social cohesion') || 
    msg.includes('peacebuilding') || msg.includes('peace') || msg.includes('coexistence')
  ) {
    return {
      text: "🤝 Community Development & Social Cohesion:\n\nWe facilitate community dialogue, joint livelihood initiatives, and leadership forums that bridge refugee and host communities to cultivate long-term peace and cooperation.",
      link: { text: 'Explore Community Initiatives →', url: '/programs' },
      quickReplies: ['Our Programs', 'Contact Us', 'Main Menu']
    };
  }

  // 8. GENERAL PROGRAMS
  if (
    msg.includes('program') || msg.includes('what do you do') || msg.includes('what does resti do') || 
    msg.includes('activities') || msg.includes('initiatives') || msg.includes('our programs') ||
    msg.includes('projects')
  ) {
    return {
      text: "RESTI works across 4 core program areas in Kiryandongo District:\n\n🌱 Livelihoods & Skills Development\n💧 Clean Water & WASH\n🌍 Environmental Sustainability & Climate Resilience\n🤝 Community Development & Social Cohesion\n\nWhich area would you like to explore?",
      link: { text: 'View All Programs →', url: '/programs' },
      quickReplies: ['Livelihoods', 'WASH', 'Environment', 'Community Development', 'Main Menu']
    };
  }

  // 9. DONATIONS / GIVING
  if (
    msg.includes('donate') || msg.includes('donation') || msg.includes('giving') || 
    msg.includes('support') || msg.includes('contribute') || msg.includes('momo') || 
    msg.includes('mobile money') || msg.includes('mtn') || msg.includes('airtel') || 
    msg.includes('paypal') || msg.includes('card') || msg.includes('give') ||
    msg.includes('fund')
  ) {
    return {
      text: "Thank you for supporting RESTI! 💚\n\nYou can make a direct, secure donation to support community programs in Kiryandongo:\n\n• MTN MoMo & Airtel Money (Uganda)\n• International Cards & PayPal\n• Direct Bank Transfer",
      link: { text: 'Donate to RESTI →', url: '/donate' },
      quickReplies: ['About RESTI', 'Our Programs', 'Contact Us', 'Main Menu']
    };
  }

  // 10. RESOURCES & DOWNLOADS
  if (
    msg.includes('resource') || msg.includes('report') || msg.includes('download') || 
    msg.includes('document') || msg.includes('audit') || msg.includes('financial') || 
    msg.includes('publication') || msg.includes('policy') || msg.includes('form')
  ) {
    return {
      text: "You can freely access and download our verified publications, audited financial statements, annual reports, and organizational policies on our Resources page.",
      link: { text: 'View Resources & Downloads →', url: '/resources' },
      quickReplies: ['Our Programs', 'Donate', 'Contact Us', 'Main Menu']
    };
  }

  // 11. EVENTS & ACTIVITIES
  if (
    msg.includes('event') || msg.includes('activity') || msg.includes('activities') || 
    msg.includes('workshop') || msg.includes('training') || msg.includes('schedule') || 
    msg.includes('upcoming') || msg.includes('calendar')
  ) {
    return {
      text: "Follow RESTI's upcoming community events, training sessions, stakeholder workshops, and past activity highlights on our Events page.",
      link: { text: 'View Events & Activities →', url: '/events' },
      quickReplies: ['Our Programs', 'Resources', 'Contact Us', 'Main Menu']
    };
  }

  // 12. LOCATION & OFFICE
  if (
    msg.includes('where') || msg.includes('location') || msg.includes('office') || 
    msg.includes('address') || msg.includes('kiryandongo') || msg.includes('bweyale') || 
    msg.includes('located') || msg.includes('find you')
  ) {
    return {
      text: "📍 RESTI CBO Office:\nKiryandongo Refugee Settlement & Bweyale Town, Kiryandongo District, Uganda.\n\n🕒 Hours: Monday – Friday, 8:30 AM – 5:00 PM (EAT).",
      link: { text: 'View Map & Directions →', url: '/contact' },
      quickReplies: ['Contact Us', 'Our Programs', 'Main Menu']
    };
  }

  // 13. CONTACT US
  if (
    msg.includes('contact') || msg.includes('email') || msg.includes('phone') || 
    msg.includes('call') || msg.includes('whatsapp') || msg.includes('reach') || 
    msg.includes('message') || msg.includes('touch')
  ) {
    return {
      text: "You can reach the RESTI team through our official channels:\n\n📧 Email: info@resticbo.org\n📞 Phone: +256 700 000 000\n📍 Kiryandongo District, Uganda",
      link: { text: 'Contact Us →', url: '/contact' },
      quickReplies: ['Speak to Staff', 'About RESTI', 'Main Menu']
    };
  }

  // 14. PARTNERSHIPS & OPPORTUNITIES / VOLUNTEERING
  if (
    msg.includes('partner') || msg.includes('collaborate') || msg.includes('volunteer') || 
    msg.includes('job') || msg.includes('career') || msg.includes('tender') || 
    msg.includes('opportunity') || msg.includes('opportunities') || msg.includes('join')
  ) {
    return {
      text: "We welcome partners, volunteers, and collaboration on community-led solutions in Kiryandongo. Explore current vacancies, tenders, and partnership avenues:",
      link: { text: 'View Opportunities →', url: '/opportunities' },
      quickReplies: ['Contact Us', 'Our Programs', 'Main Menu']
    };
  }

  // 15. HUMAN ASSISTANCE / SPEAK TO STAFF
  if (
    msg.includes('human') || msg.includes('person') || msg.includes('agent') || 
    msg.includes('staff') || msg.includes('representative') || msg.includes('speak to') || 
    msg.includes('talk to')
  ) {
    return {
      text: "I would be glad to connect you with our field team! 🙋\n\nPlease enter your email address or phone number, along with your inquiry. Our team will review your message and reply promptly.",
      link: { text: 'Send Message Directly →', url: '/contact' },
      quickReplies: ['Contact Us', 'Main Menu']
    };
  }

  // 16. GRATITUDE & FAREWELL
  if (
    msg.includes('thank') || msg.includes('thanks') || msg.includes('bye') || 
    msg.includes('goodbye') || msg.includes('great') || msg.includes('awesome')
  ) {
    return {
      text: "You're very welcome! 💚 Thank you for connecting with RESTI CBO. Feel free to reach out anytime.",
      quickReplies: ['Our Programs', 'Donate', 'Main Menu']
    };
  }

  // 17. FRIENDLY FALLBACK (Unknown questions)
  return {
    text: "I'm not sure I understood that. I can help you with RESTI's programs, resources, donations, events, or contact information.",
    quickReplies: [
      'Our Programs',
      'Resources',
      'Donate',
      'Contact Us'
    ]
  };
}
