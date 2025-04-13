'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, identify } from '@/src/utils/mixpanel';
import { useSession } from 'next-auth/react';

export default function MixpanelProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname !== lastTrackedPath.current) {
      if (session?.user?.id && session?.user?.email) {
        identify(session.user.id);
      }

      trackPageView(pathname);
      lastTrackedPath.current = pathname;
    }
  }, [pathname, searchParams, session]);

  return null;
} 