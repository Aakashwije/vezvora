/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The PDF renderer reads the letterhead from `public/` at runtime. Static
  // assets are not traced into serverless function bundles automatically, so
  // the quotation routes declare it explicitly.
  outputFileTracingIncludes: {
    "/api/quotations/**": ["./public/quotation/**"],
    "/admin/quotations/**": ["./public/quotation/**"],
    "/quotation": ["./public/quotation/**"],
  },
};

export default nextConfig;
