// Billing pages open from an SMS, so they speak the landlord's language (Swahili by default).
export const BILLING_COPY = {
  sw: {
    otherLanguage: "English",
    signInWithSmsCode: "Ingia kwa msimbo wa SMS",
    tryAgain: "Jaribu tena",
    openingLink: "Tunafungua kiungo chako...",
    linkErrors: {
      link_invalid: {
        title: "Kiungo hiki si sahihi",
        body: "Hakikisha umefungua kiungo kamili kutoka kwenye SMS, au ingia kwa msimbo wa SMS.",
      },
      link_expired: {
        title: "Muda wa kiungo hiki umeisha",
        body: "Kiungo kinatumika kwa saa 24 tu. Ingia kwa msimbo wa SMS ili kuendelea.",
      },
      link_used: {
        title: "Kiungo hiki kimeshatumika",
        body: "Kila kiungo kinatumika mara moja tu. Ingia kwa msimbo wa SMS ili kuendelea.",
      },
    },
    noConnection: {
      title: "Hakuna mtandao",
      body: "Angalia intaneti yako kisha ujaribu tena.",
    },
    title: "Kifurushi chako",
    greeting: (name) => `Habari ${name}`,
    currentPlan: "Kifurushi cha sasa",
    activeUntil: (date) => `Kinatumika hadi ${date}`,
    noActivePlan: "Huna kifurushi kinachotumika",
    propertiesUsed: (used, limit) =>
      limit === -1 ? `Nyumba ${used}, bila kikomo` : `Nyumba ${used} kati ya ${limit}`,
    choosePlan: "Chagua kifurushi",
    upToProperties: (limit) => (limit === -1 ? "Nyumba bila kikomo" : `Hadi nyumba ${limit}`),
    currentBadge: "Cha sasa",
    choose: "Chagua",
    perDuration: { monthly: "/mwezi", quarterly: "/miezi 3", annual: "/mwaka" },
    checkoutTitle: "Lipia kwa simu",
    providerLabel: "Mtandao wa simu",
    phoneLabel: "Namba ya simu ya kulipia",
    missingFields: "Chagua mtandao na uweke namba ya simu.",
    checkoutNetworkError:
      "Hakuna mtandao. Kama umepokea ombi la malipo kwenye simu, likamilishe hapo; vinginevyo jaribu tena.",
    pay: (amount) => `Lipa ${amount}`,
    starting: "Inaanza...",
    cancel: "Ghairi",
    waitingTitle: "Thibitisha malipo kwenye simu yako",
    waitingBody: (phone) => `Tumetuma ombi la malipo kwenda ${phone}. Weka PIN yako ili kukamilisha. Tunasubiri uthibitisho...`,
    connectionIssue: "Tatizo la mtandao. Bado tunaangalia malipo yako...",
    successTitle: "Kifurushi chako kiko hai",
    successBody: "Rudi kwenye app. Kifurushi kipya kinatumika sasa.",
    goToDashboard: "Nenda kwenye dashibodi",
    failedTitle: "Malipo hayakukamilika",
    failedBody: "Unaweza kujaribu tena.",
    pendingTitle: "Malipo bado yanashughulikiwa",
    pendingBody:
      "Mtoa huduma bado hajathibitisha. Yakithibitishwa, kifurushi chako kitawashwa chenyewe. Usilipe tena; angalia kwenye app baada ya dakika chache.",
    sessionExpiredTitle: "Muda wa kiungo umeisha",
    sessionExpiredBody: "Omba kiungo kipya, au ingia kwa msimbo wa SMS ili kuendelea.",
    noSessionTitle: "Ingia ili kulipia kifurushi",
    noSessionBody: "Ukurasa huu ni wa wamiliki wa nyumba. Ingia kwa msimbo wa SMS ili kuendelea.",
    loadErrorTitle: "Imeshindikana kupakia vifurushi",
    genericError: "Kuna tatizo. Jaribu tena.",
  },
  en: {
    otherLanguage: "Kiswahili",
    signInWithSmsCode: "Sign in with an SMS code",
    tryAgain: "Try again",
    openingLink: "Opening your link...",
    linkErrors: {
      link_invalid: {
        title: "This link is not valid",
        body: "Make sure you opened the whole link from the SMS, or sign in with an SMS code.",
      },
      link_expired: {
        title: "This link has expired",
        body: "Links work for 24 hours. Sign in with an SMS code to continue.",
      },
      link_used: {
        title: "This link has already been used",
        body: "Each link works once. Sign in with an SMS code to continue.",
      },
    },
    noConnection: {
      title: "No connection",
      body: "Check your internet and try again.",
    },
    title: "Your plan",
    greeting: (name) => `Hello ${name}`,
    currentPlan: "Current plan",
    activeUntil: (date) => `Active until ${date}`,
    noActivePlan: "No active plan",
    propertiesUsed: (used, limit) =>
      limit === -1 ? `${used} properties, unlimited` : `${used} of ${limit} properties`,
    choosePlan: "Choose a plan",
    upToProperties: (limit) => (limit === -1 ? "Unlimited properties" : `Up to ${limit} properties`),
    currentBadge: "Current",
    choose: "Choose",
    perDuration: { monthly: "/mo", quarterly: "/3mo", annual: "/yr" },
    checkoutTitle: "Pay with mobile money",
    providerLabel: "Mobile money provider",
    phoneLabel: "Mobile number to pay from",
    missingFields: "Choose a provider and enter the mobile number.",
    checkoutNetworkError:
      "No connection. If a payment request reached your phone, finish it there; otherwise try again.",
    pay: (amount) => `Pay ${amount}`,
    starting: "Starting...",
    cancel: "Cancel",
    waitingTitle: "Confirm the payment on your phone",
    waitingBody: (phone) => `We sent a payment request to ${phone}. Enter your PIN to finish. Waiting for confirmation...`,
    connectionIssue: "Connection problem. Still checking your payment...",
    successTitle: "Your plan is active",
    successBody: "Go back to the app. Your new plan is on now.",
    goToDashboard: "Go to dashboard",
    failedTitle: "The payment did not go through",
    failedBody: "You can try again.",
    pendingTitle: "Payment still processing",
    pendingBody:
      "The provider hasn't confirmed yet. Once it does, your plan turns on by itself. Don't pay again; check the app in a few minutes.",
    sessionExpiredTitle: "This link has expired",
    sessionExpiredBody: "Request a new link, or sign in with an SMS code to continue.",
    noSessionTitle: "Sign in to pay for your plan",
    noSessionBody: "This page is for landlords. Sign in with an SMS code to continue.",
    loadErrorTitle: "Could not load the plans",
    genericError: "Something went wrong. Please try again.",
  },
};

export const SMS_SIGN_IN_FOR_BILLING_PATH = "/login?method=sms&next=%2Fbilling";

export function getBillingLanguage(user) {
  return user?.language === "en" ? "en" : "sw";
}
