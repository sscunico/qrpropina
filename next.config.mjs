import { execSync } from "child_process";

let commitSha = "unknown";
try {
  commitSha = execSync("git rev-parse --short HEAD").toString().trim();
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha
  },
  serverExternalPackages: ["@resvg/resvg-js"]
};

export default nextConfig;
