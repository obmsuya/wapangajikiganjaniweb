"use client"
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Globe, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SmsCodeForm, { SMS_CODE_COPY } from '@/components/shared/SmsCodeForm';
import AuthService from '@/services/auth';

const content = {
  en: {
    back: "Back",
    otherLanguage: "Swahili",
    title: "Delete your account",
    intro: "Delete your Wapangaji Kiganjani account and its data. You confirm with a code we send by SMS to the account's phone number.",
    whatHappensTitle: "What happens",
    whatHappens: [
      "Your account is switched off right away: you can't sign in and the app signs you out.",
      "Your data is deleted 30 days after the request.",
    ],
    landlordTitle: "Landlords",
    landlordItems: [
      "Your properties, floors and units",
      "Your tenants' records, rent and payment history",
      "Your subscription",
    ],
    walletFirstTitle: "Withdraw your wallet money first",
    walletFirst: "We can't delete a landlord account that still has money in its wallet or a withdrawal in progress. Withdraw it in the app, then come back.",
    tenantTitle: "Tenants and managers",
    tenantItems: [
      "Your name, phone number, email, photo and password are removed",
      "Your notifications and settings are deleted",
      "Your landlord keeps their records of your tenancy and rent payments, because they belong to their business",
    ],
    privacyLink: "Read our privacy policy",
    formTitle: "Confirm with an SMS code",
    confirmLabel: "I understand that my account and its data will be deleted, and this can't be undone.",
    submit: "Delete my account",
    submitting: "Deleting...",
    errors: {
      wallet_not_empty: "Your wallet still has money or a withdrawal in progress. Withdraw it in the app first, then try again.",
    },
    successTitle: "Your account will be deleted",
    successBody: (date) => `Your account is switched off. Its data will be deleted on ${date}.`,
  },
  sw: {
    back: "Rudi",
    otherLanguage: "English",
    title: "Futa akaunti yako",
    intro: "Futa akaunti yako ya Wapangaji Kiganjani na taarifa zake. Utathibitisha kwa msimbo tutakaotuma kwa SMS kwenye namba ya simu ya akaunti.",
    whatHappensTitle: "Kitakachotokea",
    whatHappens: [
      "Akaunti yako inazimwa papo hapo: huwezi kuingia, na app inakutoa.",
      "Taarifa zako zinafutwa siku 30 baada ya ombi.",
    ],
    landlordTitle: "Wamiliki wa nyumba",
    landlordItems: [
      "Nyumba, ghorofa na vyumba vyako",
      "Taarifa za wapangaji wako, kodi na historia ya malipo",
      "Kifurushi chako",
    ],
    walletFirstTitle: "Toa pesa za pochi yako kwanza",
    walletFirst: "Hatuwezi kufuta akaunti ya mwenye nyumba yenye pesa kwenye pochi au utoaji wa pesa unaoendelea. Toa pesa kwenye app, kisha urudi.",
    tenantTitle: "Wapangaji na wasimamizi",
    tenantItems: [
      "Jina, namba ya simu, barua pepe, picha na nenosiri lako vinaondolewa",
      "Arifa na mipangilio yako inafutwa",
      "Mwenye nyumba wako anabaki na kumbukumbu za upangaji wako na malipo ya kodi, kwa sababu ni za biashara yake",
    ],
    privacyLink: "Soma sera yetu ya faragha",
    formTitle: "Thibitisha kwa msimbo wa SMS",
    confirmLabel: "Naelewa kwamba akaunti yangu na taarifa zake zitafutwa, na hili haliwezi kurudishwa.",
    submit: "Futa akaunti yangu",
    submitting: "Inafuta...",
    errors: {
      wallet_not_empty: "Pochi yako bado ina pesa au utoaji wa pesa unaoendelea. Toa pesa kwenye app kwanza, kisha ujaribu tena.",
    },
    successTitle: "Akaunti yako itafutwa",
    successBody: (date) => `Akaunti yako imezimwa. Taarifa zake zitafutwa tarehe ${date}.`,
  },
};

function BulletList({ items }) {
  return (
    <ul className="space-y-2 ml-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <span className="text-primary mt-0.5" aria-hidden="true">•</span>
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DataDeletionPage() {
  const [language, setLanguage] = useState('en');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);

  const currentContent = content[language];
  const smsCodeCopy = {
    ...SMS_CODE_COPY[language],
    submitting: currentContent.submitting,
    errors: currentContent.errors,
  };

  const handleDeleteAccount = async (phoneNumber, code) => {
    const response = await AuthService.requestAccountDeletion({ phone_number: phoneNumber, otp: code });
    setScheduledFor(response?.scheduled_for || '');
  };

  const formatScheduledDate = (isoDate) => {
    if (!isoDate) return '';
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-4">
      <div className="w-full max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentContent.back}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-2 w-fit"
          >
            <Globe className="w-4 h-4" />
            {currentContent.otherLanguage}
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>{currentContent.title}</CardTitle>
            <CardDescription>{currentContent.intro}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {scheduledFor !== null ? (
              <Alert>
                <CheckCircle className="text-emerald-600" />
                <AlertTitle>{currentContent.successTitle}</AlertTitle>
                <AlertDescription>
                  {currentContent.successBody(formatScheduledDate(scheduledFor))}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <section className="space-y-3">
                  <h2 className="font-semibold">{currentContent.whatHappensTitle}</h2>
                  <BulletList items={currentContent.whatHappens} />
                </section>

                <section className="space-y-3">
                  <h2 className="font-semibold">{currentContent.landlordTitle}</h2>
                  <BulletList items={currentContent.landlordItems} />
                  <Alert>
                    <Wallet />
                    <AlertTitle>{currentContent.walletFirstTitle}</AlertTitle>
                    <AlertDescription>{currentContent.walletFirst}</AlertDescription>
                  </Alert>
                </section>

                <section className="space-y-3">
                  <h2 className="font-semibold">{currentContent.tenantTitle}</h2>
                  <BulletList items={currentContent.tenantItems} />
                </section>

                <Separator />

                <section className="space-y-4">
                  <h2 className="font-semibold">{currentContent.formTitle}</h2>
                  <SmsCodeForm
                    copy={smsCodeCopy}
                    requestCode={AuthService.requestAccountDeletionOtp}
                    submitCode={handleDeleteAccount}
                    submitLabel={currentContent.submit}
                    submitVariant="destructive"
                    isSubmitBlocked={!hasConfirmed}
                  >
                    <label className="flex items-start gap-3 text-sm cursor-pointer">
                      <Checkbox
                        checked={hasConfirmed}
                        onCheckedChange={(checked) => setHasConfirmed(checked === true)}
                        className="mt-0.5"
                      />
                      <span className="text-muted-foreground">{currentContent.confirmLabel}</span>
                    </label>
                  </SmsCodeForm>
                </section>
              </>
            )}

            <p className="text-sm text-center">
              <Link href="/privacy" className="text-primary hover:underline">
                {currentContent.privacyLink}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
