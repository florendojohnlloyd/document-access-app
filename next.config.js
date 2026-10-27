/** @type {import('next').NextConfig} */
const buildId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  `${Date.now()}`;

// DocuVault moved to Google Apps Script with files in Google Drive (Oct 2026).
// public/app.html is the new app's page (a copy of the Apps Script project's Index.html); it talks to the
// Apps Script JSON API. Every old URL is sent there, so bookmarks keep working. Temporary (307), so it can be undone.
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  async redirects() {
    return [{ source: '/:path((?!app\\.html$).*)', destination: '/app.html', permanent: false }];
  },
  experimental: {
    // Increase body size limit to 500MB for file uploads
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};
module.exports = nextConfig;

