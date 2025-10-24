/** @type {import('next').NextConfig} */
const nextConfig = {
    cacheComponents: true,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.myanimelist.net',
        },
      ],
      qualities: [75, 80],
    },
  };
  
  export default nextConfig;
