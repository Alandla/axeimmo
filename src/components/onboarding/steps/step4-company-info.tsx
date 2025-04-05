"use client"

import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useState, useEffect } from "react"

interface Step4Props {
  errors?: Record<string, boolean>
}

const isValidUrl = (url: string): boolean => {
  try {
    // Remove any whitespace
    url = url.trim();
    
    // Check if it's just a single word without dots
    if (!url.includes('.')) {
      return false;
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    // Check if hostname has at least one dot and no spaces
    return urlObj.hostname.includes('.') && !urlObj.hostname.includes(' ');
  } catch {
    return false;
  }
};

export default function Step4CompanyInfo({ errors = {} }: Step4Props) {
  const { dataCompany, updateCompanyData, setWebsiteValid } = useOnboardingStore();
  const [urlError, setUrlError] = useState<string>("");

  const handleWebsiteChange = (value: string) => {
    updateCompanyData({ website: value });
    
    const isValid = !value || isValidUrl(value);
    setWebsiteValid(isValid);
    
    if (value && !isValid) {
      setUrlError("Please enter a valid URL");
    } else {
      setUrlError("");
    }
  };

  useEffect(() => {
    if (dataCompany.website) {
      const isValid = isValidUrl(dataCompany.website);
      setWebsiteValid(isValid);
      
      if (!isValid) {
        setUrlError("Please enter a valid URL");
      }
    }
  }, [dataCompany.website, setWebsiteValid]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tell us about your company</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex justify-between">
            <span>Company Name</span>
          </Label>
          <Input
            id="companyName"
            value={dataCompany.companyName}
            onChange={(e) => updateCompanyData({ companyName: e.target.value })}
            placeholder="Your company name"
            className={errors.companyName ? "border-red-500" : ""}
          />
          {errors.companyName && <p className="text-xs text-red-500 mt-1">Company name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex justify-between">
            <span>Website (optional)</span>
          </Label>
          <Input
            id="website"
            value={dataCompany.website}
            onChange={(e) => handleWebsiteChange(e.target.value)}
            placeholder="https://yourcompany.com"
            className={urlError ? "border-red-500" : ""}
          />
          {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
          {errors.website && <p className="text-xs text-red-500 mt-1">URL invalide</p>}
        </div>
      </div>
    </div>
  )
}

