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
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        // Only try to fetch if user might be authenticated
        const token = localStorage.getItem('access_token');
        if (!token) {
          // Skip API call, use fallback plans
          setSubscriptionPlans(t.pricing.fallbackPlans);
          return;
        }
        
        const { default: SubscriptionService } = await import('../services/landlord/subscription');
        const response = await SubscriptionService.getSubscriptionPlans();
        // ... rest of your code
      } catch (error) {
        // Don't log the error if it's auth-related for landing page
        setSubscriptionPlans(t.pricing.fallbackPlans);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [language]);

  // Property carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPropertyIndex((prev) => (prev + 1) % propertyImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return pricingPeriod === 'annual' 
      ? `TSh ${(price * 12 * 0.8).toLocaleString()}` 
      : `TSh ${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden light">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .property-card {
          transition: all 0.3s ease;
          transform-style: preserve-3d;
        }

        .property-card:hover {
          transform: translateY(-8px) rotateX(5deg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .scroll-animate {
          opacity: 0;
          transform: translateY(30px);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center group">
              <div className="relative">
                <Building2 className="h-8 w-8 mr-3 text-blue-600 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-blue-600 rounded-full blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.brand}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105 font-medium">
                {t.nav.features}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105 font-medium">
                {t.nav.pricing}
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105 font-medium">
                {t.nav.contact}
              </a>
              
              {/* Language Toggle */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{language === 'en' ? 'SW' : 'EN'}</span>
              </button>
            </nav>
            
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className="py-2 px-4 text-gray-600 hover:text-blue-600 transition-all duration-300 font-medium">
                {t.nav.login}
              </a>
              <a href="/login?type=partner" className="py-2 px-4 text-sm bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-700 rounded-lg transition-all duration-300 hover:scale-105 font-medium">
                {t.nav.partnerLogin}
              </a>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Globe className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-white/95 backdrop-blur-md py-4 animate-fade-in-up">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                   onClick={() => setIsMenuOpen(false)}>{t.nav.features}</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                   onClick={() => setIsMenuOpen(false)}>{t.nav.pricing}</a>
                <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                   onClick={() => setIsMenuOpen(false)}>{t.nav.contact}</a>
                <div className="pt-4 border-t space-y-2">
                  <a href="/login" className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                     onClick={() => setIsMenuOpen(false)}>{t.nav.login}</a>
                  <a href="/login?type=partner" className="block py-2 text-purple-600 hover:text-purple-700 transition-colors"
                     onClick={() => setIsMenuOpen(false)}>{t.nav.partnerLogin}</a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
              
              {/* Left Column - Hero Content */}
              <div className="space-y-8 animate-fade-in-up">
                {/* Problem Hook */}
                <div className="inline-flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium border border-red-200 animate-pulse">
                  <Clock className="h-4 w-4 mr-2" />
                  {t.hero.problem}
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="text-gray-900">{t.hero.title}</span>
                    <br />
                    <span className="gradient-text">{t.hero.titleHighlight}</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                    {t.hero.subtitle}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/register" 
                    className="group inline-flex items-center justify-center py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    {t.hero.cta}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                  <button className="group inline-flex items-center justify-center py-4 px-8 bg-white hover:bg-gray-50 text-gray-900 rounded-xl border-2 border-gray-200 hover:border-blue-300 font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <Play className="mr-2 h-5 w-5 text-blue-600" />
                    {t.hero.watchDemo}
                  </button>
                </div>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                  <div className="text-center sm:text-left">
                    <div className="text-2xl font-bold text-blue-600">{t.hero.stats.properties.split(' ')[0]}</div>
                    <div className="text-sm text-gray-600">{t.hero.stats.properties.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-2xl font-bold text-green-600">{t.hero.stats.revenue.split(' ')[0]}</div>
                    <div className="text-sm text-gray-600">{t.hero.stats.revenue.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-2xl font-bold text-purple-600">{t.hero.stats.landlords.split(' ')[0]}</div>
                    <div className="text-sm text-gray-600">{t.hero.stats.landlords.split(' ').slice(1).join(' ')}</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Property Showcase */}
              <div className="relative animate-slide-in-right">
                <div className="relative max-w-lg mx-auto">
                  {/* Main Property Card */}
                  <div className="property-card bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-600">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <img 
                        src={propertyImages[currentPropertyIndex].src}
                        alt={propertyImages[currentPropertyIndex].alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Building2 className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg font-semibold">{propertyImages[currentPropertyIndex].title}</p>
                        </div>
                      </div>
                      
                      {/* Live indicator */}
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        LIVE
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {propertyImages[currentPropertyIndex].title}
                          </h3>
                          <p className="text-gray-600 text-sm">{propertyImages[currentPropertyIndex].units}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {propertyImages[currentPropertyIndex].income}
                          </div>
                          <div className="text-xs text-gray-500">Monthly Income</div>
                        </div>
                      </div>
                      
                      {/* Property metrics */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">98%</div>
                          <div className="text-xs text-gray-500">Occupancy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">100%</div>
                          <div className="text-xs text-gray-500">On Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">4.9</div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating mini cards */}
                  <div className="absolute -top-8 -left-8 bg-white rounded-lg shadow-lg p-4 animate-float">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Auto Payment</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-8 bg-white rounded-lg shadow-lg p-4 animate-float" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">+TSh 2.3M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problems Section - Redesigned */}
        <section className="py-20 bg-gradient-to-b from-red-50 to-white scroll-animate">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.problems.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t.problems.subtitle}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {t.problems.items.map((problem, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-red-100"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Problem icon */}
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{problem.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{problem.description}</p>
                  
                  {/* Loss metric */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="text-sm text-red-600 font-medium">COST:</div>
                    <div className="text-lg font-bold text-red-700">{problem.loss}</div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section - Enhanced */}
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white scroll-animate">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.solution.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t.solution.subtitle}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              {t.solution.items.map((item, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-blue-100"
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    {/* Icon with animated background */}
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-500"></div>
                      <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <item.icon className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
                    
                    {/* Success metric */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4">
                      <div className="text-sm text-green-600 font-medium">RESULT:</div>
                      <div className="text-lg font-bold text-green-700">{item.metric}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Features Section - Enhanced */}
        <section id="features" className="py-20 bg-gray-50 scroll-animate">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Complete Property Management Suite
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to run a professional property business
              </p>
            </div>
            
            {/* Feature tabs */}
            <div className="mb-16">
              <div className="flex justify-center mb-12">
                <div className="bg-white p-2 rounded-2xl shadow-lg">
                  <button 
                    className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                      activeFeature === 'landlords' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    onClick={() => setActiveFeature('landlords')}
                  >
                    {t.features.landlords.title}
                  </button>
                  <button 
                    className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                      activeFeature === 'tenants' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    }`}
                    onClick={() => setActiveFeature('tenants')}
                  >
                    {t.features.tenants.title}
                  </button>
                </div>
              </div>
              
              {/* Feature content */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                {activeFeature === 'landlords' && (
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="p-12 lg:p-16">
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.features.landlords.title}</h3>
                      <p className="text-xl text-gray-600 mb-8">{t.features.landlords.subtitle}</p>
                      <div className="space-y-4">
                        {t.features.landlords.items.map((feature, index) => (
                          <div 
                            key={index} 
                            className="flex items-start group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 group-hover:bg-blue-200 transition-colors">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-900 transition-colors">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-12 lg:p-16 flex items-center justify-center relative overflow-hidden">
                      {/* Dashboard mockup */}
                      <div className="relative w-full max-w-sm">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-16 flex items-center px-6">
                            <div className="flex space-x-2">
                              <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
                              <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
                              <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
                            </div>
                            <div className="text-white font-semibold ml-4">Dashboard</div>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-green-50 p-4 rounded-xl">
                                <div className="text-2xl font-bold text-green-600">TSh 45M</div>
                                <div className="text-sm text-gray-600">Monthly Income</div>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-xl">
                                <div className="text-2xl font-bold text-blue-600">24</div>
                                <div className="text-sm text-gray-600">Properties</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="bg-gray-50 h-4 rounded-full"></div>
                              <div className="bg-gray-50 h-4 rounded-full w-3/4"></div>
                              <div className="bg-gray-50 h-4 rounded-full w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating elements */}
                      <div className="absolute top-8 right-8 bg-white rounded-xl p-3 shadow-lg animate-float">
                        <Bell className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="absolute bottom-8 left-8 bg-white rounded-xl p-3 shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeFeature === 'tenants' && (
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-12 lg:p-16 flex items-center justify-center relative overflow-hidden">
                      {/* Mobile app mockup */}
                      <div className="relative">
                        <div className="w-64 h-96 bg-white rounded-3xl shadow-2xl overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                          <div className="bg-gradient-to-r from-green-600 to-blue-600 h-20 flex items-center justify-center">
                            <Smartphone className="h-8 w-8 text-white" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="text-center">
                              <div className="text-xl font-bold text-gray-900">Pay Rent</div>
                              <div className="text-gray-600">Unit 3B - March 2025</div>
                            </div>
                            <div className="space-y-4">
                              <button className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold">
                                M-Pesa Payment
                              </button>
                              <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold">
                                Tigo Pesa Payment
                              </button>
                              <button className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold">
                                Bank Transfer
                              </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                              <div className="text-sm text-gray-600">Amount Due</div>
                              <div className="text-2xl font-bold text-gray-900">TSh 850,000</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating elements */}
                      <div className="absolute top-8 left-8 bg-white rounded-xl p-3 shadow-lg animate-float">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="absolute bottom-8 right-8 bg-white rounded-xl p-3 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                        <Camera className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-12 lg:p-16">
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.features.tenants.title}</h3>
                      <p className="text-xl text-gray-600 mb-8">{t.features.tenants.subtitle}</p>
                      <div className="space-y-4">
                        {t.features.tenants.items.map((feature, index) => (
                          <div 
                            key={index} 
                            className="flex items-start group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 group-hover:bg-green-200 transition-colors">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-900 transition-colors">{feature}</span>
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

        {/* Pricing Section - Enhanced */}
        <section id="pricing" className="py-20 bg-white scroll-animate">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.pricing.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                {t.pricing.subtitle}
              </p>
              
              {/* Pricing Toggle */}
              <div className="inline-flex items-center bg-gray-100 rounded-2xl p-1 shadow-inner">
                <button 
                  className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                    pricingPeriod === 'monthly' 
                      ? 'bg-white text-gray-900 shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setPricingPeriod('monthly')}
                >
                  {t.pricing.monthly}
                </button>
                <button 
                  className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 relative ${
                    pricingPeriod === 'annual' 
                      ? 'bg-white text-gray-900 shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setPricingPeriod('annual')}
                >
                  {t.pricing.annual}
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {t.pricing.save}
                  </span>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading pricing plans...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {(subscriptionPlans.length > 0 ? subscriptionPlans : t.pricing.fallbackPlans).map((plan, index) => (
                  <div 
                    key={index} 
                    className={`relative bg-white rounded-3xl border-2 p-8 transition-all duration-500 hover:-translate-y-2 ${
                      plan.popular 
                        ? 'border-blue-500 shadow-2xl scale-105 bg-gradient-to-b from-blue-50 to-white' 
                        : 'border-gray-200 shadow-xl hover:border-blue-300 hover:shadow-2xl'
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                      <div className="mb-6">
                        {plan.price === 0 ? (
                          <div className="text-4xl font-bold text-gray-900">Free</div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-4xl font-bold text-gray-900">
                              {formatPrice(plan.price)}
                            </div>
                            <div className="text-gray-600">
                              /{pricingPeriod === 'annual' ? 'year' : 'month'}
                            </div>
                            {pricingPeriod === 'annual' && plan.price > 0 && (
                              <div className="text-sm text-green-600 font-semibold">
                                Save TSh {(plan.price * 12 * 0.2).toLocaleString()}/year
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 text-lg">{plan.description}</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-0.5">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <a 
                      href={plan.price === 0 ? "/register" : "/register"} 
                      className={`block w-full text-center py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section - Enhanced */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white scroll-animate">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.testimonials.title}
              </h2>
              <p className="text-xl text-gray-600">{t.testimonials.subtitle}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {t.testimonials.items.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Stars */}
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </blockquote>
                  
                  {/* Metric highlight */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <div className="text-sm text-green-600 font-medium">SUCCESS METRIC:</div>
                    <div className="text-xl font-bold text-green-700">{testimonial.metric}</div>
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white relative overflow-hidden scroll-animate">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-soft-light opacity-10 animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-soft-light opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t.cta.title}
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
              {t.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
              <a 
                href="/register" 
                className="group inline-flex items-center justify-center py-4 px-8 bg-white text-blue-600 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg font-bold"
              >
                {t.cta.button}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <button className="group inline-flex items-center justify-center py-4 px-8 bg-transparent border-2 border-white text-white rounded-2xl hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 text-lg font-bold">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
            
            <p className="text-blue-100 text-sm opacity-80">{t.cta.guarantee}</p>
          </div>
        </section>
      </main>

      {/* Footer - Enhanced */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <Building2 className="h-8 w-8 mr-3 text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm opacity-20"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t.brand}
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                The most trusted property management platform in East Africa. Join thousands of landlords who transformed their property business.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Blog</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Contact Us</a></li>
                <li>
                  <div className="flex items-center text-gray-400 mb-2 hover:text-white transition-colors">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href="tel:+255123456789" className="hover:underline">+255 123 456 789</a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center text-gray-400 hover:text-white transition-colors">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href="mailto:support@wapangaji.com" className="hover:underline">support@wapangaji.com</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 {t.brand}. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:underline">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Partner CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="/register/partner" 
          className="group inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-pulse"
        >
          <Handshake className="h-5 w-5 mr-2" />
          <div className="text-left">
            <div className="text-sm font-bold">
              {language === 'en' ? 'Become Partner' : 'Kuwa Mshirika'}
            </div>
            <div className="text-xs opacity-80">
              {language === 'en' ? 'Earn commissions' : 'Pata malipo'}
            </div>
          </div>
        </a>
      </div>

      {/* Property Carousel Dots */}
      <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="flex flex-col space-y-2">
          {propertyImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPropertyIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentPropertyIndex === index 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}