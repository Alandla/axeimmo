"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step6Props {
  errors?: Record<string, boolean>
}

const targetClients = ["familles", "cadres", "investisseurs", "expatries", "seniors", "etudiants"]
const targetClientKeys = ["familles", "cadres", "investisseurs", "expatries", "seniors", "etudiants"]

export default function Step6TargetClients({ errors = {} }: Step6Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step6');

  const handleTargetClientToggle = async (targetClient: string) => {
    const currentClients = dataCompany.targetClients;
    const newClients = currentClients.includes(targetClient)
      ? currentClients.filter(client => client !== targetClient)
      : [...currentClients, targetClient];
    await updateCompanyData({ targetClients: newClients });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.targetClients && <p className="text-xs text-red-500">{t('target-clients-error')}</p>}

      <div className="grid grid-cols-2 gap-3">
        {targetClients.map((client, index) => (
          <button
            key={client}
            onClick={() => handleTargetClientToggle(client)}
            className={`relative overflow-hidden rounded-lg border p-3 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataCompany.targetClients.includes(client)
                ? "border-primary bg-primary text-black"
                : errors.targetClients
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10 text-sm">{t(`target-clients.${targetClientKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
