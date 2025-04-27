import config from "@/config";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/src/components/ui/toaster";
import { CrispChat } from "./crisp-chat";
import MicrosoftClarity from "./metrics/MicrosoftClarity";
import GoogleAnalytics from "./metrics/GoogleAnalytics";
import MixpanelProvider from "./metrics/MixpanelProvider";
import FacebookPixel from "./metrics/Facebook";

const ClientLayout = async ({ children }: { children: React.ReactNode }) => {
  const messages = await getMessages();
  return (
    <>
      {process.env.NODE_ENV !== 'development' && <MicrosoftClarity />}
      {process.env.NODE_ENV !== 'development' && <GoogleAnalytics />}
      {process.env.NODE_ENV !== 'development' && <FacebookPixel />}
      <SessionProvider>
        <NextIntlClientProvider messages={messages}>
          <Toaster />
          <NextTopLoader color={config.colors.main} showSpinner={false} />
          {children}
          <CrispChat />
          {process.env.NODE_ENV !== 'development' && <MixpanelProvider />}
        </NextIntlClientProvider>
      </SessionProvider>
    </>
  );
};

export default ClientLayout;