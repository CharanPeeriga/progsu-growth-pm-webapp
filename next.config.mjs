/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Barrel files (lucide-react ships ~1500 icon modules, @base-ui/react ~40
  // entrypoints) are the single biggest cost in both dev compile time and the
  // client bundle. This rewrites `import { X } from "pkg"` into deep imports so
  // only the modules actually used are ever compiled.
  experimental: {
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
