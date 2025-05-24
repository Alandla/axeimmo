import {getRequestConfig} from 'next-intl/server';
import { auth } from "@/src/lib/auth"

export default getRequestConfig(async () => {
  const session = await auth()
  const locale = session?.user?.options?.lang || 'en'
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});