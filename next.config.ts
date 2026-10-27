import type { NextConfig } from "next";

const config: NextConfig = {
  // An isolated build lets checks run while a development server uses .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default config;
