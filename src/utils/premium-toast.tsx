'use client';

import { Rocket } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/src/hooks/use-toast';

export function usePremiumToast() {
  const { toast } = useToast();

  /**
   * Affiche un toast premium avec un bouton d'upgrade
   * @param title Le titre du toast
   * @param description La description du toast
   * @param upgradeText Le texte du bouton d'upgrade (default: "Upgrade")
   */
  const showPremiumToast = (
    title: string, 
    description: string, 
    upgradeText: string = "Upgrade"
  ) => {
    return toast({
      variant: "premium",
      title,
      description,
      action: (
        <Link href="/dashboard/pricing" target="_blank">
          <Button variant="outline" className="border-[#FB5688] text-[#FB5688] hover:bg-[#FB5688] hover:text-white mt-2 w-full">
            <Rocket className="h-4 w-4" />
            {upgradeText}
          </Button>
        </Link>
      )
    });
  };

  return { showPremiumToast };
} 