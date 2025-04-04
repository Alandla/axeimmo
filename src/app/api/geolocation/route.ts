import { geolocation } from '@vercel/functions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { country } = geolocation(request);
  
  // Liste des pays européens (codes ISO)
  const europeanCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO'
  ];

  // Déterminer la devise par défaut en fonction du pays
  const isEuropean = europeanCountries.includes(country || '');
  const recommendedCurrency = isEuropean ? 'EUR' : 'USD';

  return NextResponse.json({
    data: {
      country,
      recommendedCurrency
    }
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
} 