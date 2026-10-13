/** @type {import('next').NextConfig} */
const buildId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  `${Date.now()}`;

const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
};
module.exports = nextConfig;

