import config from "@/config";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/src/components/ui/toaster";
import { CrispChat } from "./crisp-chat";

const ClientLayout = async ({ children }: { children: React.ReactNode }) => {
  const messages = await getMessages();
  return (
    <>
      <SessionProvider>
        <NextIntlClientProvider messages={messages}>
          <Toaster />
          <NextTopLoader color={config.colors.main} showSpinner={false} />
          {children}
          <CrispChat />
        </NextIntlClientProvider>
      </SessionProvider>
    </>
  );
};

export default ClientLayout;