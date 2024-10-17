'use client'

import Image from "next/image"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useTranslations } from "next-intl"

export default function Page() {

  const t = useTranslations('login');
  const tFooter = useTranslations('footer');

  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="flex flex-col justify-between w-1/2 p-8 bg-white">
        {/* Logo */}
        <Image src="/img/logo.png" alt="Logo" width={769} height={364} className="w-24 h-auto mb-8 sm:w-32 md:w-38" />
        
        <div className="flex flex-col items-center justify-center flex-grow">
          <h1 className="text-2xl font-bold mb-2 text-center">{t('title')}</h1>
          <p className="text-gray-600 mb-8 text-center">{t('welcome')}</p>
          
          {/* Login options */}
          <div className="space-y-4 w-full max-w-sm">
            <Button variant="outline" className="w-full">
              <IconGoogle className="h-4 w-4" />
              Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{t('orContinueWith')}</span>
              </div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input type="email" id="email" placeholder={t('emailPlaceholder')} />
              </div>
              <Button type="submit" className="w-full">{t('loginButton')}</Button>
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between text-sm text-gray-500 w-full">
          <p>{tFooter('rights')}</p>
          <div>
            <Link href="/privacy" className="hover:underline">{tFooter('privacy')}</Link>
            <span className="mx-2">|</span>
            <Link href="/terms" className="hover:underline">{tFooter('terms')}</Link>
          </div>
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-black text-white p-8 rounded-l-lg">
        {/* Ajoutez ici le contenu du côté droit */}
      </div>
    </div>
  )
}

export function IconGoogle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M15.545 6.558a9.42 9.42 0 01.139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 118 0a7.689 7.689 0 015.352 2.082l-2.284 2.284A4.347 4.347 0 008 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 000 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 001.599-2.431H8v-3.08h7.545z" />
    </svg>
  );
}
