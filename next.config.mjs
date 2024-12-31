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
};
 
export default withNextIntl(nextConfig);