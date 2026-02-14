import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: 'standalone',
};

export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   output: 'export',  // ← GANTI dari 'standalone' jadi 'export'
//   images: {
//     unoptimized: true  // ← TAMBAHKAN ini
//   }
//   // config lain tetap
// };

// export default nextConfig;