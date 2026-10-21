/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nothing here uses next/image (posters need plain <img> for the export),
  // so its optimizer endpoint is switched off rather than left exposed.
  images: { unoptimized: true },
};

export default nextConfig;
