import type { NextConfig } from "next";

// const withPWA = require("next-pwa")({
//   dest: "public",
//   disable: process.env.NODE_ENV === "development",
//   register: true,
//   skipWaiting: true,
// });

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  typescript: {
    // Atenção: Isto permite build de Produção falhar no Tipo
    ignoreBuildErrors: true,
  },
};

export default nextConfig; // withPWA(nextConfig);
