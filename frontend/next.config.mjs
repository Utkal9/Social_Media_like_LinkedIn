/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactStrictMode: true,
    env: {
        // Make sure this points to your backend (localhost for dev, Render URL for prod)
        NEXT_PUBLIC_API_URL:
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
    },
};

export default nextConfig;
