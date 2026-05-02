import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)"],
        sans: ["var(--font-ibm-plex-sans)"],
      },
    },
  },
};

export default config;
