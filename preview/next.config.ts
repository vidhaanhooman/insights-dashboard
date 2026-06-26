import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      // Land on the Overview dashboard by default.
      { source: "/", destination: "/overview", permanent: true },
    ];
  },
};

export default nextConfig;
