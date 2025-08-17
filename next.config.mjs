import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'files2.heygen.ai',
      'images.pexels.com',
      's3.eu-west-3.amazonaws.com',
      'media.hoox.video'
    ],
  },
  // Configuration pour supprimer les console.log en production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  }
};
 
export default withNextIntl(nextConfig);