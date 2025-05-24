"use client"

import { ArrowRight, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import PricingPage from "@/src/components/pricing-page"
import { Button } from "@/src/components/ui/button"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function ThankYou() {
  const [showPricing, setShowPricing] = useState(false)
  const t = useTranslations('onboarding')

  // Déclencher les confettis à l'affichage du composant
  useEffect(() => {
    const triggerConfetti = () => {
      const end = Date.now() + 2000; // 2 secondes
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });

        requestAnimationFrame(frame);
      };

      frame();
    };

    triggerConfetti();

    // Afficher la page des tarifs après 3 secondes
    const timerPricing = setTimeout(() => {
      setShowPricing(true);
    }, 3000);

    return () => {
      clearTimeout(timerPricing);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!showPricing ? (
        <motion.div
          key="thank-you"
          className="flex flex-col items-center justify-center py-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <motion.h2
            className="text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {t('thank-you.title') || "Thank you!"}
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {t('thank-you.description') || "Your onboarding is complete. We're excited to have you on board and can't wait to help you achieve your goals."}
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          key="pricing"
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <motion.h2
              className="text-3xl font-bold max-w-lg mx-auto md:pt-0 pt-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t('pricing.title') || "Choose your plan"}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <Link href="/dashboard/create">
                <Button variant="ghost" size="lg">
                  {t('pricing.continue-free-trial') || "Continue with free trial"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

          </div>
          
          <PricingPage isSimplified={true} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

