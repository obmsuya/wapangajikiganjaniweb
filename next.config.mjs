/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
    ],
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
