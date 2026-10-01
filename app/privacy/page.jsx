"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPolicyPage() {
  const [language, setLanguage] = useState('en');

  const content = {
    en: {
      title: "Privacy Policy",
      updated: "Last updated: 1 October 2026",
      intro: "Wapangaji Kiganjani (the mobile app and wapangaji.com) is run by Faltasi Innovation Limited, Dar es Salaam, Tanzania. This policy explains what we collect, why, who we share it with, how long we keep it, and how to delete it.",
      sections: [
        {
          title: "What we collect",
          items: [
            "Account details: your name and phone number, and your email and profile photo if you add them. Your password is stored only in scrambled (hashed) form.",
            "For landlords and managers: properties, rooms and their photos, the tenants you add (name and phone number), rent amounts and repair requests.",
            "Payments: rent payments, the mobile money number used, amounts, dates and references; for landlords, the wallet balance and the number withdrawals are sent to.",
            "Messages you send in the service, such as repair requests and replies.",
            "One-time SMS codes, stored scrambled until they are used or expire.",
            "Server logs: your IP address, device type, the time and the request made, each time the app or website talks to our server.",
            "We do not collect your location, contacts or advertising ID. There are no ads and no analytics or tracking tools."
          ]
        },
        {
          title: "Why we use it",
          items: [
            "To create your account and let you sign in",
            "To run the service: properties, tenants and rent, and letting landlords, tenants and managers reach each other",
            "To collect payments and send withdrawals",
            "To send you SMS and in-app notices about your account, rent, payments and sign-in codes",
            "To keep accounts safe, prevent fraud and fix problems",
            "We never sell your data and never use it for advertising."
          ]
        },
        {
          title: "Who we share it with",
          text: "Only these providers, and only what each needs to do its job for us. Each must protect your data at least as well as we do.",
          items: [
            "AzamPay (payments): phone number, amount and reference, to collect payments and send withdrawals",
            "Notify Africa (SMS): phone number and message text, to deliver SMS",
            "Cloudflare (storage): the photos you upload and our encrypted database backups",
            "Our hosting provider, which runs our server",
            "Inside the service: a landlord and their managers see their tenants' details, and a tenant sees their landlord's name and contacts",
            "Authorities, only when the law requires it"
          ]
        },
        {
          title: "How we protect it",
          text: "Everything travels encrypted (HTTPS). Passwords and codes are stored scrambled. Only the people who run the service can reach the data. No system is perfectly secure, so tell us at once if you notice anything wrong."
        },
        {
          title: "How long we keep it",
          items: [
            "Your data is kept while your account is open.",
            "When you ask to delete your account, it is switched off at once and its data is deleted 30 days later.",
            "If a landlord deletes their account, their properties, tenants and payments are deleted.",
            "If a tenant or manager deletes their account, their sign-in, contact details and photo are removed. The landlord keeps their own record of the tenancy and rent paid, as their business records.",
            "Server logs are deleted after 30 days, and backups after 30 days."
          ]
        },
        {
          title: "Your choices",
          items: [
            "See and correct your details in the app under Account › Profile.",
            "Delete your account in the app (Account › Delete account) or on the web without the app.",
            "Turn reminders off in the app or in your phone's settings.",
            "Ask us for a copy of your data, or anything about your privacy, by email."
          ],
          link: { href: "/remove-account", label: "Delete your account" }
        },
        {
          title: "Children",
          text: "The service is for adults (18 and over). We do not knowingly collect data from anyone under 18; if we learn we have, we delete it."
        },
        {
          title: "Changes",
          text: "When this policy changes we update the date above, and we tell you in the app about important changes."
        },
        {
          title: "Contact us",
          text: "Faltasi Innovation Limited, Dar es Salaam, Tanzania. Email: wapangaji.dev@gmail.com · Phone: +255 712 433 664"
        }
      ],
      footer: "© 2026 Faltasi Innovation Limited. All rights reserved."
    },
    sw: {
      title: "Sera ya Faragha",
      updated: "Ilisasishwa: 1 Oktoba 2026",
      intro: "Wapangaji Kiganjani (programu ya simu na wapangaji.com) inaendeshwa na Faltasi Innovation Limited, Dar es Salaam, Tanzania. Sera hii inaeleza tunachokusanya, kwa nini, tunashirikiana na nani, tunakihifadhi kwa muda gani, na jinsi ya kukifuta.",
      sections: [
        {
          title: "Tunachokusanya",
          items: [
            "Taarifa za akaunti: jina lako na namba ya simu, na barua pepe na picha yako ukiziweka. Nenosiri lako huhifadhiwa likiwa limefichwa (hashed) tu.",
            "Kwa wenye nyumba na wasimamizi: mali, vyumba na picha zake, wapangaji unaowaongeza (jina na namba ya simu), kiasi cha kodi na maombi ya matengenezo.",
            "Malipo: malipo ya kodi, namba ya pesa ya simu iliyotumika, kiasi, tarehe na kumbukumbu; kwa wenye nyumba, salio la pochi na namba ambayo pesa hutolewa kwenda.",
            "Ujumbe unaotuma kwenye huduma, kama maombi ya matengenezo na majibu.",
            "Misimbo ya SMS ya mara moja, iliyofichwa hadi itumike au iishe muda.",
            "Kumbukumbu za seva: anwani yako ya IP, aina ya kifaa, muda na ombi lililofanywa, kila programu au tovuti inapowasiliana na seva yetu.",
            "Hatukusanyi mahali ulipo, anwani za simu yako wala kitambulisho cha matangazo. Hakuna matangazo wala zana za kufuatilia."
          ]
        },
        {
          title: "Kwa nini tunazitumia",
          items: [
            "Kufungua akaunti yako na kukuwezesha kuingia",
            "Kuendesha huduma: mali, wapangaji na kodi, na kuwaunganisha wenye nyumba, wapangaji na wasimamizi",
            "Kupokea malipo na kutuma pesa zinazotolewa",
            "Kukutumia SMS na taarifa ndani ya programu kuhusu akaunti, kodi, malipo na misimbo ya kuingia",
            "Kulinda akaunti, kuzuia udanganyifu na kurekebisha matatizo",
            "Hatuuzi taarifa zako kamwe wala kuzitumia kwa matangazo."
          ]
        },
        {
          title: "Tunashirikiana na nani",
          text: "Watoa huduma hawa tu, na kile tu kila mmoja anachohitaji kutufanyia kazi yake. Kila mmoja lazima alinde taarifa zako angalau kama sisi.",
          items: [
            "AzamPay (malipo): namba ya simu, kiasi na kumbukumbu, ili kupokea malipo na kutuma pesa",
            "Notify Africa (SMS): namba ya simu na maandishi ya ujumbe, ili kufikisha SMS",
            "Cloudflare (hifadhi): picha unazopakia na nakala zetu za hifadhi zilizofichwa",
            "Mtoa huduma wa seva yetu",
            "Ndani ya huduma: mwenye nyumba na wasimamizi wake huona taarifa za wapangaji wao, na mpangaji huona jina na mawasiliano ya mwenye nyumba",
            "Mamlaka, pale tu sheria inapotaka"
          ]
        },
        {
          title: "Tunavyozilinda",
          text: "Kila kitu husafirishwa kikiwa kimefichwa (HTTPS). Manenosiri na misimbo huhifadhiwa yakiwa yamefichwa. Ni wanaoendesha huduma tu wanaoweza kufikia taarifa. Hakuna mfumo ulio salama kabisa, hivyo tuambie mara moja ukiona jambo lisilo sawa."
        },
        {
          title: "Tunazihifadhi kwa muda gani",
          items: [
            "Taarifa zako huhifadhiwa akaunti yako ikiwa wazi.",
            "Ukiomba kufuta akaunti, inazimwa papo hapo na taarifa zake zinafutwa baada ya siku 30.",
            "Mwenye nyumba akifuta akaunti, mali, wapangaji na malipo yake vinafutwa.",
            "Mpangaji au msimamizi akifuta akaunti, kuingia kwake, mawasiliano na picha vinaondolewa. Mwenye nyumba anabaki na kumbukumbu yake ya upangishaji na kodi iliyolipwa, kama kumbukumbu za biashara yake.",
            "Kumbukumbu za seva hufutwa baada ya siku 30, na nakala za hifadhi baada ya siku 30."
          ]
        },
        {
          title: "Machaguo yako",
          items: [
            "Ona na urekebishe taarifa zako kwenye programu, Akaunti › Wasifu.",
            "Futa akaunti yako kwenye programu (Akaunti › Futa akaunti) au kwenye tovuti bila programu.",
            "Zima vikumbusho kwenye programu au kwenye mipangilio ya simu.",
            "Tuombe nakala ya taarifa zako, au lolote kuhusu faragha yako, kwa barua pepe."
          ],
          link: { href: "/remove-account", label: "Futa akaunti yako" }
        },
        {
          title: "Watoto",
          text: "Huduma hii ni ya watu wazima (miaka 18 na zaidi). Hatukusanyi kwa makusudi taarifa za mtu chini ya miaka 18; tukigundua, tunazifuta."
        },
        {
          title: "Mabadiliko",
          text: "Sera hii ikibadilika tunasasisha tarehe iliyo juu, na tunakujulisha kwenye programu kuhusu mabadiliko makubwa."
        },
        {
          title: "Wasiliana nasi",
          text: "Faltasi Innovation Limited, Dar es Salaam, Tanzania. Barua pepe: wapangaji.dev@gmail.com · Simu: +255 712 433 664"
        }
      ],
      footer: "© 2026 Faltasi Innovation Limited. Haki zote zimehifadhiwa."
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
            <p className="text-sm text-gray-500">
              {currentContent.updated}
            </p>
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
                
                {section.text && (
                  <p className="text-gray-700 leading-relaxed">
                    {section.text}
                  </p>
                )}
                {section.items && (
                  <ul className="space-y-2 ml-4">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.link && (
                  <Link href={section.link.href} className="inline-block text-blue-700 font-medium hover:underline">
                    {section.link.label}
                  </Link>
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