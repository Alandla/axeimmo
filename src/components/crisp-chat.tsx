'use client'

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export const CrispChat = () => {
  const pathname = usePathname();
  const { data: session } = useSession()

  useEffect(() => {
    Crisp.configure("ddcd3b39-f7b4-46f7-92c0-ca6180926e1b");

    Crisp.chat.show();
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (session?.user) {
      Crisp.session.setData({ userId: session.user?.id });
    }
  }, [session]);

  return null;
};