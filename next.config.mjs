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

  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === 'production') {
      // Supprime les console.log uniquement côté client en production
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }
    return config;
  },
};
 
export default withNextIntl(nextConfig);