/**
 * cards.js — the Opening Hand card pool.
 *
 * Data only. Nothing here knows how a card is rendered, which is what makes
 * adding, removing or rewording a card a one-line change.
 *
 * Shape:
 *   id          number   → also the printed card number, zero-padded (014)
 *   name        string   → natural case; used for the accessible name
 *   category    string   → DEVELOPMENT | WEBOPS | EXPERIENCE | PERSONAL
 *   type        string   → printed on the front, above the title
 *   frontLabel  string[] → one entry per printed line (CSS uppercases it)
 *   description string   → the reverse face
 *   note        string?  → optional second line on the reverse
 *   titleSize   string?  → "long" or "xlong"; steps the front title down
 *                          for labels that would otherwise overrun the
 *                          card. Classified here, in the data, so no
 *                          JavaScript ever measures typography at runtime.
 *
 * Exposed as a global rather than an ES module so the site keeps working
 * from file:// — same reason as window.OK in utils.js.
 */

window.OK_CARDS = (function () {
  'use strict';

  const POOL = [
    /* ---- Development ------------------------------------------------- */
    {
      id: 1,
      name: 'WordPress',
      category: 'DEVELOPMENT',
      type: 'PLATFORM',
      frontLabel: ['WordPress'],
      titleSize: 'long',
      description: 'My primary CMS experience — development, maintenance, troubleshooting, security and production support.',
      note: null
    },
    {
      id: 2,
      name: 'Shopify',
      category: 'DEVELOPMENT',
      type: 'PLATFORM',
      frontLabel: ['Shopify'],
      description: 'Theme customization, Liquid, metafields, metaobjects and custom product architecture.',
      note: null
    },
    {
      id: 3,
      name: 'JavaScript',
      category: 'DEVELOPMENT',
      type: 'LANGUAGE',
      frontLabel: ['JavaScript'],
      titleSize: 'long',
      description: 'Frontend functionality, debugging, integrations and interactive experiences — including this one.',
      note: null
    },
    {
      id: 4,
      name: 'PHP',
      category: 'DEVELOPMENT',
      type: 'LANGUAGE',
      frontLabel: ['PHP'],
      description: 'WordPress customization, hooks, troubleshooting and custom functionality.',
      note: null
    },
    {
      id: 5,
      name: 'CSS',
      category: 'DEVELOPMENT',
      type: 'LANGUAGE',
      frontLabel: ['CSS'],
      description: 'Responsive interfaces, custom layouts, interaction design and fixing things that absolutely should have aligned the first time.',
      note: null
    },
    {
      id: 6,
      name: 'HTML',
      category: 'DEVELOPMENT',
      type: 'LANGUAGE',
      frontLabel: ['HTML'],
      description: 'Semantic markup, accessible structure and the part everything else still depends on.',
      note: null
    },
    {
      id: 7,
      name: 'Liquid',
      category: 'DEVELOPMENT',
      type: 'LANGUAGE',
      frontLabel: ['Liquid'],
      description: 'Custom Shopify templates, sections and dynamic product experiences.',
      note: null
    },
    {
      id: 8,
      name: 'WooCommerce',
      category: 'DEVELOPMENT',
      type: 'ECOMMERCE',
      frontLabel: ['WooCommerce'],
      titleSize: 'xlong',
      description: 'Product functionality, checkout customization and third-party integrations.',
      note: null
    },
    {
      id: 9,
      name: 'MySQL',
      category: 'DEVELOPMENT',
      type: 'DATA',
      frontLabel: ['MySQL'],
      description: 'Database investigation, WordPress troubleshooting and occasionally finding things that definitely should not be there.',
      note: null
    },

    /* ---- WebOps ------------------------------------------------------- */
    {
      id: 10,
      name: 'Debugging',
      category: 'WEBOPS',
      type: 'ABILITY',
      frontLabel: ['Debugging'],
      titleSize: 'long',
      description: 'Give me the symptom first. Finding the actual problem is the interesting part.',
      note: null
    },
    {
      id: 11,
      name: 'Root cause analysis',
      category: 'WEBOPS',
      type: 'ABILITY',
      frontLabel: ['Root cause', 'analysis'],
      titleSize: 'long',
      description: 'I prefer understanding why something failed rather than stopping once it works again.',
      note: null
    },
    {
      id: 12,
      name: 'DevTools',
      category: 'WEBOPS',
      type: 'TOOL',
      frontLabel: ['DevTools'],
      description: 'Console, Network, Sources and Elements — usually one of the first places I look when something behaves strangely.',
      note: null
    },
    {
      id: 13,
      name: 'DNS',
      category: 'WEBOPS',
      type: 'INFRASTRUCTURE',
      frontLabel: ['DNS'],
      description: 'Records, nameservers, domain routing and the occasional reminder that "the website is down" doesn’t necessarily mean the website is down.',
      note: null
    },
    {
      id: 14,
      name: 'Security',
      category: 'WEBOPS',
      type: 'INCIDENT RESPONSE',
      frontLabel: ['Security'],
      description: 'Malware investigation, suspicious JavaScript, database injections, SEO spam and compromised WordPress installations.',
      note: null
    },
    {
      id: 15,
      name: 'Performance',
      category: 'WEBOPS',
      type: 'PERFORMANCE',
      frontLabel: ['Performance'],
      titleSize: 'xlong',
      description: 'Caching, JavaScript optimization, production regressions and figuring out which optimization optimized the website into not working.',
      note: null
    },
    {
      id: 16,
      name: 'Hosting',
      category: 'WEBOPS',
      type: 'INFRASTRUCTURE',
      frontLabel: ['Hosting'],
      description: 'Production environments, staging, migrations, SSL, caching and deployment troubleshooting.',
      note: null
    },
    {
      id: 17,
      name: 'Analytics',
      category: 'WEBOPS',
      type: 'TOOLING',
      frontLabel: ['Analytics'],
      description: 'Google Tag Manager, Google Analytics, consent-aware tracking and debugging third-party script behavior.',
      note: null
    },

    /* ---- Experience --------------------------------------------------- */
    {
      id: 18,
      name: 'Client communication',
      category: 'EXPERIENCE',
      type: 'ABILITY',
      frontLabel: ['Client', 'communication'],
      titleSize: 'xlong',
      description: 'Technical problems still need to make sense to the person paying to have them fixed.',
      note: null
    },
    {
      id: 19,
      name: 'Technical support',
      category: 'EXPERIENCE',
      type: 'ROLE',
      frontLabel: ['Technical', 'support'],
      description: 'Supporting production websites taught me that the interesting problems rarely arrive with reproduction steps.',
      note: null
    },
    {
      id: 20,
      name: 'UX / UI',
      category: 'EXPERIENCE',
      type: 'DESIGN',
      frontLabel: ['UX / UI'],
      description: 'Before focusing heavily on development, I worked in UX/UI design for websites and WordPress projects.',
      note: null
    },
    {
      id: 21,
      name: 'Leadership',
      category: 'EXPERIENCE',
      type: 'MANAGEMENT',
      frontLabel: ['Leadership'],
      titleSize: 'long',
      description: 'Before moving fully into web work, I managed a customer-service team of approximately 20 people.',
      note: null
    },
    {
      id: 22,
      name: 'Quality analysis',
      category: 'EXPERIENCE',
      type: 'OPERATIONS',
      frontLabel: ['Quality', 'analysis'],
      description: 'Earlier in my career I worked in quality analysis, auditing performance and helping ensure client metrics were being met.',
      note: null
    },
    {
      id: 23,
      name: 'SEO',
      category: 'EXPERIENCE',
      type: 'MARKETING',
      frontLabel: ['SEO'],
      description: 'Earlier WordPress work included managing and optimizing website content for search.',
      note: null
    },
    {
      id: 24,
      name: 'HubSpot',
      category: 'EXPERIENCE',
      type: 'CRM',
      frontLabel: ['HubSpot'],
      description: 'CRM management and website-related marketing workflows.',
      note: null
    },

    /* ---- Personal ----------------------------------------------------- */
    {
      id: 25,
      name: 'MTG player',
      category: 'PERSONAL',
      type: 'INTEREST',
      frontLabel: ['MTG player'],
      titleSize: 'long',
      description: 'If the Mulligan button didn’t already give this away: yes, I play Magic.',
      note: 'Commander player.'
    },
    {
      id: 26,
      name: 'Problem solver',
      category: 'PERSONAL',
      type: 'TRAIT',
      frontLabel: ['Problem', 'solver'],
      description: 'Probably the most consistent thread across my career — quality analysis, management, UX and development.',
      note: null
    },
    {
      id: 27,
      name: 'Bilingual',
      category: 'PERSONAL',
      type: 'COMMUNICATION',
      frontLabel: ['ES / EN'],
      description: 'Native Spanish speaker. Professionally fluent in English.',
      note: null
    },
    {
      id: 28,
      name: 'Honduras',
      category: 'PERSONAL',
      type: 'LOCATION',
      frontLabel: ['Honduras'],
      description: 'Based in Honduras and working remotely with international teams.',
      note: null
    },
    {
      id: 29,
      name: 'Photography',
      category: 'PERSONAL',
      type: 'INTEREST',
      frontLabel: ['Photography'],
      titleSize: 'xlong',
      description: 'One of my interests outside development and part of my earlier design background.',
      note: null
    }
  ];

  /**
   * Deliberately kept out of POOL. It is spliced into a hand by
   * opening-hand.js and can never be drawn by the normal shuffle.
   */
  const BUG = {
    id: 0,
    name: 'The bug',
    category: 'INCIDENT',
    type: 'UNKNOWN',
    frontLabel: ['The bug'],
    description: 'Nobody can reproduce it.',
    note: null
  };

  return { POOL, BUG, HAND_SIZE: 7 };
})();
