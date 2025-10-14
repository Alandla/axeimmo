'use client'

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { IconGoogle } from "../components/icons/google-icon"
import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { getDeviceId } from "../utils/mixpanel"

export default function Page() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      if (!session.user.hasFinishedOnboarding) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, router])

  const t = useTranslations('login');
  const tFooter = useTranslations('footer');
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendedEmail, setSendedEmail] = useState(false);

  const handleSignInGoogle = async () => {
    const deviceId = getDeviceId();
    await signIn('google', {
      callbackUrl: '/dashboard',
      deviceId
    })
  }

  const handleSignInEmail = async () => {
    setLoading(true);
    const deviceId = getDeviceId();
    const result = await signIn('http-email', { 
      email: email, 
      redirect: false,
      deviceId
    })
    if (result?.error) {
      toast({
        title: t('error-title'),
        description: t(`error-${result.error}`),
        variant: 'destructive',
      })
      setLoading(false);
      return;
    }
    setSendedEmail(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="flex flex-col justify-between w-full md:w-1/2 p-8 bg-white">
        {/* Logo */}
        <Image src="/img/logo_little.png" alt="Logo" width={769} height={364} className="w-24 h-auto mb-8 sm:w-32 md:w-38" />
        
        <div className="flex flex-col items-center justify-center flex-grow">
          {!sendedEmail ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center">{t('title')}</h1>
              <p className="text-gray-600 mb-8 text-center">{t('welcome')}</p>
              
              {/* Login options */}
              <div className="space-y-4 w-full max-w-sm">
                <Button variant="outline" className="w-full" onClick={handleSignInGoogle}>
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
                    <Input type="email" id="email" placeholder={t('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} onClick={handleSignInEmail} >
                    {t('loginButton')}
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 w-full max-w-sm">
              <h2 className="text-2xl font-bold mb-2">{t('checkEmail')}</h2>
              <p className="text-gray-600 mb-8">{t('emailSent')}</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://gmail.com', '_blank')}
              >
                <IconGoogle className="h-4 w-4" />
                {t('openGmail')}
              </Button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-between text-sm text-gray-500 w-full">
          <p>{tFooter('rights').replace('2024', new Date().getFullYear().toString())}</p>
          <div>
            <Link href="/privacy-policy" className="hover:underline">{tFooter('privacy')}</Link>
            <span className="mx-2">|</span>
            <Link href="/tos" className="hover:underline">{tFooter('terms')}</Link>
          </div>
        </div>
      </div>
      
      {/* Right side */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-black text-white p-8 rounded-l-lg">
        {/* Ajoutez ici le contenu du côté droit */}
      </div>
    </div>
  )
}
