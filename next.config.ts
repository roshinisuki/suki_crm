const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000', '*.devtunnels.ms'],
    },
  },
  allowedDevOrigins: ['ferment-hardly-frighten.ngrok-free.dev', '*.ngrok-free.dev'],
  env: {
    NEXT_PUBLIC_CRM_VARIANT: process.env.NEXT_PUBLIC_CRM_VARIANT || "1",
  },
};

module.exports = nextConfig;
