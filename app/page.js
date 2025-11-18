"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Globe, Users, CreditCard, BarChart3, Check } from 'lucide-react';

export default function WapangajiLanding() {
  const [lang, setLang] = useState('en');
  
  const content = {
    en: {
      nav: {
        features: "Features",
        pricing: "Pricing",
        about: "About",
        contact: "Contact",
        privacy: "Privacy",
        terms: "Terms",
        removeAccount: "Remove Account"
      },
      hero: {
        title: "Wapangaji Property Management System",
        subtitle: "Simplify your property management with automated rent collection, tenant management, and real-time analytics.",
        landlordLogin: "Landlord Login",
        tenantLogin: "Tenant Login",
        agentLogin: "Agent Login"
      },
      shares: {
        title: "Invest in Wapangaji",
        description: "Want to buy shares in Wapangaji? Download the Faltasi Wealth mobile app to start investing today."
      },
      features: {
        title: "Key Features",
        items: [
          {
            title: "Automated Rent Collection",
            description: "Collect rent automatically through M-Pesa, Tigo Pesa, and Airtel Money"
          },
          {
            title: "Tenant Management",
            description: "Manage tenants, leases, and maintenance requests in one place"
          },
          {
            title: "Real-Time Analytics",
            description: "Track income, expenses, and property performance with detailed reports"
          },
          {
            title: "Multi-Property Support",
            description: "Manage multiple properties and units from a single dashboard"
          }
        ]
      },
      pricing: {
        title: "Simple Pricing",
        starter: {
          name: "Starter",
          price: "Free",
          features: ["Up to 5 properties", "Basic tenant management", "Mobile money payments", "Email support"]
        },
        professional: {
          name: "Professional",
          price: "TSh 15,000/month",
          features: ["Up to 25 properties", "Advanced analytics", "Tenant screening", "Priority support"]
        },
        enterprise: {
          name: "Enterprise",
          price: "TSh 45,000/month",
          features: ["Unlimited properties", "Multi-user access", "API access", "Dedicated support"]
        }
      },
      footer: {
        copyright: "© 2025 Wapangaji. All rights reserved.",
        phone: "+255 123 456 789",
        email: "support@wapangaji.com"
      }
    },
    sw: {
      nav: {
        features: "Huduma",
        pricing: "Bei",
        about: "Kuhusu",
        contact: "Mawasiliano",
        privacy: "Faragha",
        terms: "Masharti"
      },
      hero: {
        title: "Mfumo wa Usimamizi wa Mali wa Wapangaji",
        subtitle: "Rahisisha usimamizi wa mali yako kwa ukusanyaji otomatiki wa kodi, usimamizi wa wapangaji, na uchambuzi wa wakati halisi.",
        landlordLogin: "Ingia - Mwenye Nyumba",
        tenantLogin: "Ingia - Mpangaji",
        agentLogin: "Ingia - Wakala"
      },
      shares: {
        title: "Wekeza kwenye Wapangaji",
        description: "Unataka kununua hisa za Wapangaji? Pakua programu ya Faltasi Wealth ili kuanza kuwekeza leo."
      },
      features: {
        title: "Vipengele Muhimu",
        items: [
          {
            title: "Ukusanyaji Otomatiki wa Kodi",
            description: "Kusanya kodi otomatiki kupitia M-Pesa, Tigo Pesa, na Airtel Money"
          },
          {
            title: "Usimamizi wa Wapangaji",
            description: "Simamia wapangaji, mikataba, na maombi ya marekebisho mahali pamoja"
          },
          {
            title: "Uchambuzi wa Wakati Halisi",
            description: "Fuatilia mapato, matumizi, na utendaji wa mali kwa ripoti za kina"
          },
          {
            title: "Msaada wa Mali Nyingi",
            description: "Simamia mali na vitengo vingi kutoka dashibodi moja"
          }
        ]
      },
      pricing: {
        title: "Bei Rahisi",
        starter: {
          name: "Mwanzo",
          price: "Bure",
          features: ["Hadi mali 5", "Usimamizi wa kimsingi wa wapangaji", "Malipo ya pesa za simu", "Msaada wa barua pepe"]
        },
        professional: {
          name: "Kitaalamu",
          price: "TSh 15,000/mwezi",
          features: ["Hadi mali 25", "Uchambuzi wa hali ya juu", "Uchunguzi wa wapangaji", "Msaada wa kipaumbele"]
        },
        enterprise: {
          name: "Biashara",
          price: "TSh 45,000/mwezi",
          features: ["Mali zisizo na kikomo", "Ufikiaji wa watumiaji wengi", "Ufikiaji wa API", "Msaada mahsusi"]
        }
      },
      footer: {
        copyright: "© 2025 Wapangaji. Haki zote zimehifadhiwa.",
        phone: "+255 123 456 789",
        email: "support@wapangaji.com"
      }
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Wapangaji</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-4 flex-wrap">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.features}</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.pricing}</a>
              <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.about}</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.contact}</a>
              <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.privacy}</a>
              <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.terms}</a>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              >
                <Globe className="h-4 w-4 mr-2" />
                {lang === 'en' ? 'SW' : 'EN'}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.hero.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t.hero.subtitle}
            </p>
            
            {/* Property Image */}
            <div className="mb-8">
              <img 
                src="/images/modern-apartment-complex.jpg" 
                alt="Modern apartment complex"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            {/* Login Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/login?type=landlord">{t.hero.landlordLogin}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/login?type=tenant">{t.hero.tenantLogin}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/login?type=agent">{t.hero.agentLogin}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t.shares.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                {t.shares.description}
              </p>
              <div className="text-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  {lang === 'en' ? 'Download Faltasi Wealth App' : 'Pakua Programu ya Faltasi Wealth'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t.features.title}</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.items.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    {index === 0 && <CreditCard className="h-6 w-6 text-blue-600" />}
                    {index === 1 && <Users className="h-6 w-6 text-blue-600" />}
                    {index === 2 && <BarChart3 className="h-6 w-6 text-blue-600" />}
                    {index === 3 && <Building2 className="h-6 w-6 text-blue-600" />}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional Property Images */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <img 
              src="/images/modern-condo.jpg" 
              alt="Modern condo"
              className="w-full h-48 object-cover rounded-lg shadow"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <img 
              src="/images/commercial-building.jpg" 
              alt="Commercial building"
              className="w-full h-48 object-cover rounded-lg shadow"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <img 
              src="/images/residential-houses.jpg" 
              alt="Residential houses"
              className="w-full h-48 object-cover rounded-lg shadow"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t.pricing.title}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{t.pricing.starter.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{t.pricing.starter.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.pricing.starter.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <a href="/register">{lang === 'en' ? 'Get Started' : 'Anza'}</a>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-blue-600 border-2">
              <CardHeader>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">
                  {lang === 'en' ? 'Popular' : 'Maarufu'}
                </div>
                <CardTitle>{t.pricing.professional.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{t.pricing.professional.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.pricing.professional.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" asChild>
                  <a href="/register">{lang === 'en' ? 'Start Free Trial' : 'Anza Jaribio'}</a>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{t.pricing.enterprise.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{t.pricing.enterprise.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.pricing.enterprise.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <a href="/contact">{lang === 'en' ? 'Contact Sales' : 'Wasiliana'}</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-lg font-bold">Wapangaji</span>
              </div>
              <p className="text-gray-400 text-sm">
                {lang === 'en' 
                  ? 'Modern property management platform for East Africa'
                  : 'Jukwaa la kisasa la usimamizi wa mali kwa Afrika Mashariki'
                }
              </p>
            </div>

            {/* Contact */}
            <div id="about">
              <h3 className="font-bold mb-4">{t.nav.contact}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t.footer.phone}</li>
                <li>{t.footer.email}</li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold mb-4">{lang === 'en' ? 'Quick Links' : 'Viungo'}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">{t.nav.features}</a></li>
                <li><a href="/remove-account" className="hover:text-white">{t.nav.removeAccount}</a></li>
                <li><a href="/privacy" className="hover:text-white">{t.nav.privacy}</a></li>
                <li><a href="/terms" className="hover:text-white">{t.nav.terms}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
            {t.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}