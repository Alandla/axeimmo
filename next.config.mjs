import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'files2.heygen.ai',
      'images.pexels.com'
    ],
  },
};
 
export default withNextIntl(nextConfig);