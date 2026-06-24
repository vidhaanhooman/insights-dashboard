import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Land on the Overview dashboard.
      { source: "/", destination: "/overview", permanent: false },
    ];
  },
};

export default nextConfig;
