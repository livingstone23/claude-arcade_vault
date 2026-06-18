import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '127.0.2.2', 
    '127.0.2.2:3000', 
    '192.168.68.56',       
    '192.168.68.56:3000'   
  ],
};

export default nextConfig;
