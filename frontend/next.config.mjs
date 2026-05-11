/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the multi-stage Docker build (copies only the minimal
  // server bundle into the production image instead of the full node_modules)
  output: "standalone",
};

export default nextConfig;
