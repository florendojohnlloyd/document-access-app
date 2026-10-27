/** @type {import('next').NextConfig} */
const buildId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  `${Date.now()}`;

// DocuVault moved to Google Apps Script with files in Google Drive (Oct 2026).
// Every old link now sends people to the new app. Temporary (307), so it can be undone.
const NEW_APP_URL =
  'https://script.google.com/macros/s/AKfycbwPszZvhZOC6CqbMiJoolh1cMESZJVRgEKlumd1LabTvm-ux72TCpqzUQK-HsHtAXaLaQ/exec';

const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  async redirects() {
    return [{ source: '/:path*', destination: NEW_APP_URL, permanent: false }];
  },
  experimental: {
    // Increase body size limit to 500MB for file uploads
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};
module.exports = nextConfig;

