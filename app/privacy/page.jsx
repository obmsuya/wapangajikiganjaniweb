"use client"
import React, { useState } from 'react';
import { ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPolicyPage() {
  const [language, setLanguage] = useState('en');

  const content = {
    en: {
      title: "Privacy Policy",
      intro: "This privacy policy applies to the Wapangaji Kiganjani app. Created by Faltasi Innovation Limited as a free service.",
      sections: [
        {
          title: "Information We Collect",
          items: [
            "Your device's IP address",
            "Pages you visit and when you visit them",
            "Your device's operating system",
            "Your name and phone number",
            "Payment information (through secure third-party services)"
          ]
        },
        {
          title: "Why We Collect This Information",
          items: [
            "Create and secure your account",
            "Process rent payments",
            "Enable communication between landlords, tenants, and managers",
            "Send you important updates and notifications",
            "Improve our services",
            "Prevent fraud and keep your account safe"
          ]
        },
        {
          title: "Third-Party Services",
          text: "We use trusted services like Google Play Services and Expo. They have their own privacy policies."
        },
        {
          title: "Your Rights",
          text: "You can stop all data collection by uninstalling the app from your device at any time."
        },
        {
          title: "Security",
          text: "We use encryption and security measures to protect your information. However, no internet transmission is 100% secure."
        },
        {
          title: "Children's Privacy",
          text: "This app is not for children under 13. If we find a child under 13 has used the app, we will delete their information immediately."
        },
        {
          title: "Contact Us",
          text: "Questions? Email us at: wapangaji.dev@gmail.com"
        }
      ],
      footer: "© 2025 Faltasi Innovation Limited. All rights reserved."
    },
    sw: {
      title: "Sera ya Faragha",
      intro: "Sera hii ya faragha inatumika kwa programu ya Wapangaji Kiganjani. Imeundwa na Faltasi Innovation Limited kama huduma ya bure.",
      sections: [
        {
          title: "Taarifa Tunazokusanya",
          items: [
            "Anwani ya IP ya kifaa chako",
            "Kurasa unazozitembelea na wakati",
            "Mfumo wa uendeshaji wa kifaa chako",
            "Jina na nambari yako ya simu",
            "Taarifa za malipo (kupitia huduma za tatu salama)"
          ]
        },
        {
          title: "Kwa Nini Tunakusanya Taarifa Hizi",
          items: [
            "Kuunda na kulinda akaunti yako",
            "Kusindika malipo ya kodi",
            "Kuwezesha mawasiliano kati ya wamiliki, wapangaji, na wasimamizi",
            "Kukutumia taarifa muhimu na arifa",
            "Kuboresha huduma zetu",
            "Kuzuia ulaghai na kulinda akaunti yako"
          ]
        },
        {
          title: "Huduma za Tatu",
          text: "Tunatumia huduma zinazothibitika kama Google Play Services na Expo. Wana sera zao za faragha."
        },
        {
          title: "Haki Zako",
          text: "Unaweza kuacha ukusanyaji wote wa data kwa kuondoa programu kutoka kwenye kifaa chako wakati wowote."
        },
        {
          title: "Usalama",
          text: "Tunatumia usimbuaji na hatua za usalama kulinda taarifa zako. Hata hivyo, hakuna maambukizi ya mtandao yanayofaa 100%."
        },
        {
          title: "Faragha ya Watoto",
          text: "Programu hii si ya watoto chini ya miaka 13. Tukigundua mtoto chini ya miaka 13 ametumia programu, tutafuta taarifa zao mara moja."
        },
        {
          title: "Wasiliana Nasi",
          text: "Maswali? Tuma barua pepe: wapangaji.dev@gmail.com"
        }
      ],
      footer: "© 2025 Faltasi Innovation Limited. Haki zote zimehifadhiwa."
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'en' ? 'Back' : 'Rudi'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'Swahili' : 'English'}
          </Button>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              {currentContent.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Introduction */}
            <p className="text-gray-700 leading-relaxed">
              {currentContent.intro}
            </p>
            
            <Separator />

            {/* Sections */}
            {currentContent.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h2 className="text-lg font-semibold text-blue-700">
                  {section.title}
                </h2>
                
                {section.items ? (
                  <ul className="space-y-2 ml-4">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {section.text}
                  </p>
                )}
              </div>
            ))}

            <Separator />

            {/* Footer */}
            <p className="text-center text-sm text-gray-500">
              {currentContent.footer}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}