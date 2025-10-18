// app/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, Menu, X, ChevronRight, Star, Check, 
  Smartphone, Eye, BarChart3, Bell, MapPin, Zap, TrendingUp, DollarSign,
  Globe, Phone, Mail, Facebook, Twitter, Instagram, ArrowRight, Handshake,
  Home, Clock, CheckCircle, Play, Shield, Wifi, Camera, Calendar
} from 'lucide-react';

// Translation system
const translations = {
  en: {
    brand: "Wapangaji Kiganjani",
    nav: {
      features: "Features",
      pricing: "Pricing", 
      contact: "Contact",
      login: "Login",
      partnerLogin: "Partner Login"
    },
    hero: {
      title: "Turn Your Properties Into",
      titleHighlight: "Cash-Generating Machines",
      subtitle: "While your neighbors chase tenants for rent, you'll be counting profits from automated property management that actually works.",
      problem: "Still collecting rent with notebooks and phone calls?",
      cta: "Start Earning More Today",
      watchDemo: "Watch 2-Min Demo",
      stats: {
        properties: "1,200+ Properties Managed",
        revenue: "TSh 2.8B+ Collected",
        landlords: "450+ Happy Landlords"
      }
    },
    problems: {
      title: "The Old Way Is Killing Your Profits",
      subtitle: "Every month you stick with traditional methods, you're losing money",
      items: [
        {
          title: "Late Payments Eating Your Cash Flow",
          description: "Tenants pay when they feel like it. You're always chasing money.",
          loss: "30% Late Payment Rate"
        },
        {
          title: "Paperwork Nightmare Wastes Your Time",
          description: "Hours spent on receipts, records, and manual tracking.",
          loss: "15 Hours/Week Lost"
        },
        {
          title: "No Clear Picture of Your Income",
          description: "You can't grow what you can't measure. Flying blind.",
          loss: "Unknown Profit Margins"
        }
      ]
    },
    solution: {
      title: "What You Can Do Now That Changes Everything",
      subtitle: "Transform from stressed landlord to profitable property mogul",
      items: [
        {
          title: "Autopilot Rent Collection",
          description: "Tenants pay automatically through mobile money. No more chasing, no more excuses.",
          metric: "98% On-Time Payment Rate",
          icon: CreditCard
        },
        {
          title: "Real-Time Profit Dashboard",
          description: "See exactly how much each property makes. Spot problems before they cost you money.",
          metric: "Instant Financial Clarity",
          icon: BarChart3
        },
        {
          title: "Professional Tenant Management",
          description: "Background checks, digital contracts, automated reminders. Run like a real business.",
          metric: "50% Less Tenant Issues",
          icon: Users
        },
        {
          title: "Scale Without Stress",
          description: "Manage 50 properties as easily as 5. Systems do the work, you collect the profits.",
          metric: "Unlimited Growth Potential",
          icon: TrendingUp
        }
      ]
    },
    features: {
      landlords: {
        title: "For Property Owners",
        subtitle: "Everything you need to 10x your property business",
        items: [
          "Mobile money rent collection (M-Pesa, Tigo Pesa, Airtel Money)",
          "Automated tenant screening with ID verification", 
          "Digital lease agreements with e-signatures",
          "Real-time income and expense tracking",
          "Maintenance request automation",
          "Multi-property performance analytics"
        ]
      },
      tenants: {
        title: "For Tenants",
        subtitle: "Modern renting that tenants actually prefer",
        items: [
          "Pay rent instantly with mobile money",
          "Submit maintenance requests with photos",
          "Get instant payment confirmations",
          "Access lease documents anytime",
          "Receive important updates via SMS",
          "Rate and review properties"
        ]
      }
    },
    pricing: {
      title: "Pricing That Pays For Itself",
      subtitle: "Start free, upgrade when you're making more money",
      monthly: "Monthly",
      annual: "Annual",
      save: "Save 20%",
      fallbackPlans: [
        {
          name: "Starter",
          price: 0,
          period: "Free forever",
          description: "Perfect for testing the waters",
          features: [
            "Up to 5 properties",
            "Basic tenant management", 
            "Mobile money payments",
            "Email support"
          ],
          cta: "Start Free",
          popular: false
        },
        {
          name: "Professional", 
          price: 15000,
          period: "per month",
          description: "Most landlords choose this",
          features: [
            "Up to 25 properties",
            "Advanced analytics & reports",
            "Tenant screening",
            "Priority support",
            "Custom lease templates",
            "Maintenance tracking"
          ],
          cta: "Start 14-Day Trial",
          popular: true
        },
        {
          name: "Enterprise",
          price: 45000, 
          period: "per month",
          description: "For serious property empires",
          features: [
            "Unlimited properties",
            "Multi-user access",
            "API access",
            "Dedicated support",
            "Custom integrations",
            "Advanced reporting"
          ],
          cta: "Contact Sales",
          popular: false
        }
      ]
    },
    testimonials: {
      title: "Real Results From Real Landlords",
      subtitle: "These numbers don't lie",
      items: [
        {
          name: "Hassan Mwalimu",
          role: "15 Properties, Dar es Salaam", 
          text: "My rental income increased 40% in 6 months. Tenants pay on time because it's automatic. I wish I found this 5 years ago.",
          rating: 5,
          metric: "40% Income Increase"
        },
        {
          name: "Grace Kimaro",
          role: "Real Estate Investor",
          text: "I bought 3 new properties this year with the time I saved. The system runs my business while I focus on growing it.",
          rating: 5,
          metric: "3 New Properties"
        },
        {
          name: "John Massawe",
          role: "Property Manager, Mwanza",
          text: "Went from managing 8 properties to 35 properties with the same effort. The mobile money integration is a game-changer.",
          rating: 5,
          metric: "327% Growth"
        }
      ]
    },
    cta: {
      title: "Stop Leaving Money on the Table",
      subtitle: "Every day you wait is money lost. Your properties could be working harder for you right now.",
      button: "Start My Free Trial",
      guarantee: "No credit card required • Cancel anytime • 14-day free trial"
    }
  },
  sw: {
    brand: "Wapangaji Kiganjani",
    nav: {
      features: "Huduma",
      pricing: "Bei",
      contact: "Mawasiliano", 
      login: "Ingia",
      partnerLogin: "Ingia kwa Washirika"
    },
    hero: {
      title: "Geuza Mali Zako Kuwa",
      titleHighlight: "Mashine za Kutengeza Pesa",
      subtitle: "Wakati majirani zako wanawafuata wapangaji kwa kodi, wewe utakuwa unahesabu faida kutoka usimamizi otomatiki wa mali ambao unafanya kazi kweli kweli.",
      problem: "Bado unakusanya kodi kwa vitabu na simu?",
      cta: "Anza Kupata Zaidi Leo",
      watchDemo: "Ona Mfano wa Dakika 2",
      stats: {
        properties: "Mali 1,200+ Zinazosimamizwa",
        revenue: "TSh 2.8B+ Yamekusanywa",
        landlords: "Wamiliki 450+ Wenye Furaha"
      }
    },
    problems: {
      title: "Njia ya Kale Inamaliza Faida Zako",
      subtitle: "Kila mwezi unaoendelea na mbinu za kimila, unapoteza pesa",
      items: [
        {
          title: "Malipo ya Kuchelewa Yanakula Pesa Zako",
          description: "Wapangaji wanalipa wanapotaka. Wewe unawafuata kila wakati.",
          loss: "Asilimia 30 ya Malipo ya Kuchelewa"
        },
        {
          title: "Ndoto Mbaya ya Karatasi Inapoteza Wakati",
          description: "Masaa yamepotea kwenye risiti, rekodi, na ufuatiliaji wa mikono.",
          loss: "Masaa 15/Wiki Yamepotea"
        },
        {
          title: "Hakuna Picha Wazi ya Mapato Yako",
          description: "Huwezi kukuza kile usichokipima. Unaruka bila kuona.",
          loss: "Viwango vya Faida Havijulikani"
        }
      ]
    },
    solution: {
      title: "Unachoweza Kufanya Sasa Ambacho Kinabadilisha Kila Kitu",
      subtitle: "Mabadiliko kutoka mwenye nyumba mwenye msongo hadi mkuu wa mali mwenye faida",
      items: [
        {
          title: "Ukusanyaji Otomatiki wa Kodi",
          description: "Wapangaji wanalipa otomatiki kupitia pesa za simu. Hakuna kuwafuata, hakuna uongo.",
          metric: "Asilimia 98 ya Malipo ya Wakati",
          icon: CreditCard
        },
        {
          title: "Dashibodi ya Faida ya Wakati Halisi",
          description: "Ona haswa mali gani inaleta pesa ngapi. Tambua matatizo kabla hayajagharimu pesa.",
          metric: "Uwazi wa Kifedha wa Papo Hapo",
          icon: BarChart3
        },
        {
          title: "Usimamizi wa Kitaalamu wa Wapangaji",
          description: "Ukaguzi wa mazingira, mikataba ya dijiti, vikumbusho otomatiki. Endesha kama biashara halisi.",
          metric: "Asilimia 50 Matatizo Machache ya Wapangaji",
          icon: Users
        },
        {
          title: "Kukua Bila Msongo",
          description: "Simamia mali 50 kwa urahisi kama 5. Mifumo inafanya kazi, wewe unakusanya faida.",
          metric: "Uwezekano wa Kukua Usiokoma",
          icon: TrendingUp
        }
      ]
    },
    features: {
      landlords: {
        title: "Kwa Wamiliki wa Mali",
        subtitle: "Kila kitu unachohitaji kuongeza mara 10 biashara ya mali",
        items: [
          "Ukusanyaji wa kodi wa pesa za simu (M-Pesa, Tigo Pesa, Airtel Money)",
          "Uchunguzi otomatiki wa wapangaji na uthibitisho wa kitambulisho",
          "Mikataba ya dijiti ya upangaji na saini za kielektroniki",
          "Ufuatiliaji wa wakati halisi wa mapato na matumizi",
          "Otomatiki ya maombi ya marekebisho",
          "Uchanganuzi wa utendaji wa mali nyingi"
        ]
      },
      tenants: {
        title: "Kwa Wapangaji",
        subtitle: "Upangaji wa kisasa ambao wapangaji wanapendelea kweli",
        items: [
          "Lipa kodi papo hapo kwa pesa za simu",
          "Wasilisha maombi ya marekebisho kwa picha",
          "Pata uthibitisho wa malipo papo hapo",
          "Fikia nyaraka za mkataba wakati wowote",
          "Pokea masasisho muhimu kupitia SMS",
          "Kadiria na hakiki mali"
        ]
      }
    },
    pricing: {
      title: "Bei Inayojilipia Yenyewe",
      subtitle: "Anza bure, pandisha unapopata pesa zaidi",
      monthly: "Kila Mwezi",
      annual: "Kila Mwaka", 
      save: "Okoa 20%",
      fallbackPlans: [
        {
          name: "Mwanzo",
          price: 0,
          period: "Bure milele",
          description: "Kamili kwa kujaribu maji",
          features: [
            "Hadi mali 5",
            "Usimamizi wa kimsingi wa wapangaji",
            "Malipo ya pesa za simu",
            "Msaada wa barua pepe"
          ],
          cta: "Anza Bure",
          popular: false
        },
        {
          name: "Kitaalamu",
          price: 15000,
          period: "kwa mwezi",
          description: "Wamiliki wengi wa mali wanachagua hii",
          features: [
            "Hadi mali 25",
            "Uchanganuzi wa hali ya juu na ripoti",
            "Uchunguzi wa wapangaji",
            "Msaada wa kipaumbele",
            "Vifaa vya mkataba vya kawaida",
            "Ufuatiliaji wa marekebisho"
          ],
          cta: "Anza Jaribio la Siku 14",
          popular: true
        },
        {
          name: "Biashara",
          price: 45000,
          period: "kwa mwezi",
          description: "Kwa maimara makubwa ya mali",
          features: [
            "Mali zisizo na kikomo",
            "Ufikiaji wa watumiaji wengi",
            "Ufikiaji wa API",
            "Msaada mahsusi",
            "Miunganisho ya kawaida",
            "Uripoti wa hali ya juu"
          ],
          cta: "Wasiliana na Mauzo",
          popular: false
        }
      ]
    },
    testimonials: {
      title: "Matokeo Halisi Kutoka kwa Wamiliki Halisi wa Mali",
      subtitle: "Nambari hizi hazisemi uongo",
      items: [
        {
          name: "Hassan Mwalimu",
          role: "Mali 15, Dar es Salaam",
          text: "Mapato yangu ya upangaji yaliongezeka asilimia 40 ndani ya miezi 6. Wapangaji wanalipa kwa wakati kwa sababu ni otomatiki. Ningependa nilikipata hiki miaka 5 iliyopita.",
          rating: 5,
          metric: "Ongezeko la Mapato 40%"
        },
        {
          name: "Grace Kimaro",
          role: "Mwekezaji wa Mali",
          text: "Nilinunua mali 3 mpya mwaka huu kwa wakati niliookoa. Mfumo unaendesha biashara yangu wakati ninajikita kukuza.",
          rating: 5,
          metric: "Mali 3 Mpya"
        },
        {
          name: "John Massawe",
          role: "Msimamizi wa Mali, Mwanza",
          text: "Nilikwenda kutoka kusimamia mali 8 hadi 35 kwa juhudi sawa. Uunganisho wa pesa za simu ni mbadiliko mkubwa.",
          rating: 5,
          metric: "Ukuaji wa 327%"
        }
      ]
    },
    cta: {
      title: "Acha Kuacha Pesa Mezani",
      subtitle: "Kila siku unasubiri ni pesa iliyopotea. Mali zako zinaweza kufanya kazi kwa bidii zaidi kwako sasa hivi.",
      button: "Anza Jaribio Langu la Bure",
      guarantee: "Hakuna kadi ya mkopo inayohitajika • Ghairi wakati wowote • Jaribio la bure la siku 14"
    }
  }
};

// Property images for visual appeal
const propertyImages = [
  {
    src: "/images/modern-apartment-complex.jpg",
    alt: "Modern apartment complex with 24 units",
    title: "Luxury Apartments - Masaki",
    income: "TSh 45M/month",
    units: "24 units"
  },
  {
    src: "/images/residential-houses.jpg", 
    alt: "Row of residential rental houses",
    title: "Family Houses - Mbezi Beach",
    income: "TSh 28M/month", 
    units: "12 houses"
  },
  {
    src: "/images/commercial-building.jpg",
    alt: "Commercial building with shops and offices",
    title: "Commercial Plaza - City Center", 
    income: "TSh 67M/month",
    units: "18 shops"
  }
];

export default function LandingPage() {
  const [language, setLanguage] = useState('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState('landlords');
  const [pricingPeriod, setPricingPeriod] = useState('monthly');
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const t = translations[language];

  // Auto-detect browser language
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.includes('sw') || browserLang.includes('swahili')) {
        setLanguage('sw');
      }
    }
  }, []);

  useEffect(() => {
    setIsDarkMode(false); 

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
          setSubscriptionPlans(t.pricing.fallbackPlans);
          return;
        }
        
        const { default: SubscriptionService } = await import('../services/landlord/subscription');
        const response = await SubscriptionService.getSubscriptionPlans();
        setSubscriptionPlans(response.data);
      } catch (error) {
        setSubscriptionPlans(t.pricing.fallbackPlans);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [language]);

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return pricingPeriod === 'annual' 
      ? `TSh ${(price * 12 * 0.8).toLocaleString()}` 
      : `TSh ${price.toLocaleString()}`;
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .property-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md shadow-md border-b ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Building2 className={`h-8 w-8 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="text-xl font-bold gradient-text">
                {t.brand}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} font-medium`}>
                {t.nav.features}
              </a>
              <a href="#pricing" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} font-medium`}>
                {t.nav.pricing}
              </a>
              <a href="#contact" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} font-medium`}>
                {t.nav.contact}
              </a>
              
              {/* Language Toggle */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Globe className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{language === 'en' ? 'SW' : 'EN'}</span>
              </button>
            </nav>
            
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} py-2 px-4 font-medium`}>
                {t.nav.login}
              </a>
              <a href="/login?type=partner" className={`py-2 px-4 text-sm rounded-lg font-medium ${isDarkMode ? 'bg-purple-800/50 hover:bg-purple-700/50 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}>
                {t.nav.partnerLogin}
              </a>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} p-2`}
              >
                <Globe className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} p-2`}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className={`md:hidden border-t py-4 ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
              <nav className="flex flex-col space-y-4">
                <a href="#features" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} py-2`} onClick={() => setIsMenuOpen(false)}>{t.nav.features}</a>
                <a href="#pricing" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} py-2`} onClick={() => setIsMenuOpen(false)}>{t.nav.pricing}</a>
                <a href="#contact" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} py-2`} onClick={() => setIsMenuOpen(false)}>{t.nav.contact}</a>
                <div className="pt-4 border-t space-y-2">
                  <a href="/login" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} block py-2`} onClick={() => setIsMenuOpen(false)}>{t.nav.login}</a>
                  <a href="/login?type=partner" className={`${isDarkMode ? 'text-purple-300 hover:text-purple-400' : 'text-purple-600 hover:text-purple-700'} block py-2`} onClick={() => setIsMenuOpen(false)}>{t.nav.partnerLogin}</a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Column - Hero Content */}
              <div className="space-y-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${isDarkMode ? 'bg-red-900 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  <Clock className="h-4 w-4 mr-2" />
                  {t.hero.problem}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  <span>{t.hero.title}</span>
                  <br />
                  <span className="gradient-text">{t.hero.titleHighlight}</span>
                </h1>
                
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t.hero.subtitle}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/register" 
                    className={`py-3 px-6 ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-lg font-semibold text-center`}
                  >
                    {t.hero.cta}
                  </a>
                  <button className={`py-3 px-6 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50'} rounded-lg border font-semibold text-center`}>
                    <Play className="mr-2 h-5 w-5 inline" />
                    {t.hero.watchDemo}
                  </button>
                </div>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div className="text-center sm:text-left">
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t.hero.stats.properties.split(' ')[0]}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.hero.stats.properties.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{t.hero.stats.revenue.split(' ')[0]}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.hero.stats.revenue.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{t.hero.stats.landlords.split(' ')[0]}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.hero.stats.landlords.split(' ').slice(1).join(' ')}</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Property Showcase */}
              <div>
                <div className={`property-card ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-md overflow-hidden border`}>
                  <img 
                    src={propertyImages[0].src}
                    alt={propertyImages[0].alt}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{propertyImages[0].title}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{propertyImages[0].units}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {propertyImages[0].income}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Monthly Income</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>98%</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Occupancy</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>100%</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>On Time</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>4.9</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-red-50'}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t.problems.title}</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.problems.subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {t.problems.items.map((problem, index) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-red-100'}`}
                >
                  <div className={`w-12 h-12 ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} rounded-lg flex items-center justify-center mb-4`}>
                    <X className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2">{problem.title}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{problem.description}</p>
                  
                  <div className={` ${isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
                    <div className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'} font-medium`}>COST:</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>{problem.loss}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t.solution.title}</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.solution.subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {t.solution.items.map((item, index) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-blue-100'}`}
                >
                  <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-lg flex items-center justify-center mb-4`}>
                    <item.icon className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{item.description}</p>
                  
                  <div className={` ${isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                    <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'} font-medium`}>RESULT:</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>{item.metric}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Complete Property Management Suite</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Everything you need to run a professional property business</p>
            </div>
            
            {/* Feature tabs */}
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <div className={`p-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                  <button 
                    className={`px-6 py-2 rounded-lg font-medium ${activeFeature === 'landlords' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600')}`}
                    onClick={() => setActiveFeature('landlords')}
                  >
                    {t.features.landlords.title}
                  </button>
                  <button 
                    className={`px-6 py-2 rounded-lg font-medium ${activeFeature === 'tenants' ? (isDarkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-green-600')}`}
                    onClick={() => setActiveFeature('tenants')}
                  >
                    {t.features.tenants.title}
                  </button>
                </div>
              </div>
              
              {/* Feature content */}
              <div className={`rounded-lg shadow-md overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                {activeFeature === 'landlords' && (
                  <div className="grid lg:grid-cols-2">
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-2">{t.features.landlords.title}</h3>
                      <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{t.features.landlords.subtitle}</p>
                      <div className="space-y-2">
                        {t.features.landlords.items.map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <div className={`w-5 h-5 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-3 mt-1`}>
                              <CheckCircle className={`h-3 w-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`p-8 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-500'}`}>
                      {/* Dashboard mockup */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                        <div className={`h-8 flex items-center px-4 ${isDarkMode ? 'bg-blue-800' : 'bg-blue-600'}`}>
                          <div className="text-white font-medium">Dashboard</div>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`${isDarkMode ? 'bg-green-900' : 'bg-green-50'} p-3 rounded-lg`}>
                              <div className={`text-lg font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>TSh 45M</div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Income</div>
                            </div>
                            <div className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'} p-3 rounded-lg`}>
                              <div className={`text-lg font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>24</div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Properties</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeFeature === 'tenants' && (
                  <div className="grid lg:grid-cols-2">
                    <div className={`p-8 ${isDarkMode ? 'bg-green-900' : 'bg-green-500'}`}>
                      {/* Mobile app mockup */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                        <div className={`h-8 flex items-center justify-center ${isDarkMode ? 'bg-green-800' : 'bg-green-600'}`}>
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">Pay Rent</div>
                          </div>
                          <button className={`w-full py-2 rounded-lg font-medium ${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'}`}>M-Pesa Payment</button>
                          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount Due</div>
                            <div className="text-lg font-bold">TSh 850,000</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-2">{t.features.tenants.title}</h3>
                      <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{t.features.tenants.subtitle}</p>
                      <div className="space-y-2">
                        {t.features.tenants.items.map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <div className={`w-5 h-5 ${isDarkMode ? 'bg-green-900' : 'bg-green-100'} rounded-full flex items-center justify-center mr-3 mt-1`}>
                              <CheckCircle className={`h-3 w-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t.pricing.title}</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{t.pricing.subtitle}</p>
              
              {/* Pricing Toggle */}
              <div className={`inline-flex items-center rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium ${pricingPeriod === 'monthly' ? (isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900') : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}`}
                  onClick={() => setPricingPeriod('monthly')}
                >
                  {t.pricing.monthly}
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium relative ${pricingPeriod === 'annual' ? (isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900') : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}`}
                  onClick={() => setPricingPeriod('annual')}
                >
                  {t.pricing.annual}
                  <span className={`absolute -top-1 -right-1 ${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'} px-2 py-0.5 rounded-full text-xs`}>
                    {t.pricing.save}
                  </span>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className={`inline-block w-6 h-6 border-4 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading pricing plans...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {(subscriptionPlans.length > 0 ? subscriptionPlans : t.pricing?.fallbackPlans).map((plan, index) => (
                  <div 
                    key={index} 
                    className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border ${plan.popular ? (isDarkMode ? 'border-blue-500' : 'border-blue-500') : (isDarkMode ? 'border-gray-700' : 'border-gray-200')}`}
                  >
                    {plan.popular && (
                      <div className="text-center mb-2">
                        <div className={` ${isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'} px-4 py-1 rounded-full text-xs font-bold`}>
                          Most Popular
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        {plan.price === 0 ? (
                          <div className="text-3xl font-bold">Free</div>
                        ) : (
                          <div>
                            <div className="text-3xl font-bold">
                              {formatPrice(plan.price)}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              /{pricingPeriod === 'annual' ? 'year' : 'month'}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{plan.description}</p>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <div className={`w-5 h-5 ${isDarkMode ? 'bg-green-900' : 'bg-green-100'} rounded-full flex items-center justify-center mr-3 mt-1`}>
                            <Check className={`h-3 w-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          </div>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <a 
                      href={plan.price === 0 ? "/register" : "/register"} 
                      className={`block w-full text-center py-3 rounded-lg font-medium ${plan.popular ? (isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700') : (isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}`}
                    >
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t.testimonials.title}</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.testimonials.subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {t.testimonials.items.map((testimonial, index) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                    "{testimonial.text}"
                  </blockquote>
                  
                  <div className={` ${isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3 mb-4`}>
                    <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'} font-medium`}>SUCCESS METRIC:</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>{testimonial.metric}</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-500'} rounded-full flex items-center justify-center mr-3`}>
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-16 text-white ${isDarkMode ? 'bg-blue-900' : 'bg-blue-600'}`}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">{t.cta.subtitle}</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
              <a 
                href="/register" 
                className={`py-3 px-6 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-gray-50'} rounded-lg font-semibold text-center`}
              >
                {t.cta.button}
              </a>
              <button className={`py-3 px-6 border-2 border-white hover:bg-white hover:text-blue-600 rounded-lg font-semibold text-center`}>
                <Play className="mr-2 h-5 w-5 inline" />
                Watch Demo
              </button>
            </div>
            
            <p className="text-sm opacity-80">{t.cta.guarantee}</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className={`py-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'} text-white`}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 mr-3 text-blue-400" />
                <span className="text-xl font-bold gradient-text">
                  {t.brand}
                </span>
              </div>
              <p className="text-gray-400 mb-4">The most trusted property management platform in East Africa.</p>
              <div className="flex space-x-3">
                <a href="#" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-800'} rounded-full flex items-center justify-center text-gray-400 hover:text-white`}>
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-800'} rounded-full flex items-center justify-center text-gray-400 hover:text-white`}>
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-800'} rounded-full flex items-center justify-center text-gray-400 hover:text-white`}>
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li className="flex items-center text-gray-400"><Phone className="h-4 w-4 mr-2" /> +255 123 456 789</li>
                <li className="flex items-center text-gray-400"><Mail className="h-4 w-4 mr-2" /> support@wapangaji.com</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400 mb-2 md:mb-0">© 2025 {t.brand}. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Partner CTA */}
      <div className="fixed bottom-4 right-4 z-50">
        <a 
          href="/register/partner" 
          className={`flex items-center ${isDarkMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-lg shadow-md`}
        >
          <Handshake className="h-4 w-4 mr-2" />
          <div className="text-xs">
            {language === 'en' ? 'Become Partner' : 'Kuwa Mshirika'}
          </div>
        </a>
      </div>
    </div>
  );
}