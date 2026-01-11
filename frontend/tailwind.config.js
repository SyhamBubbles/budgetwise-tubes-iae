/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "white",
        foreground: "black",
        card: "white",
        "card-foreground": "black",
        popover: "white",
        "popover-foreground": "black",
        primary: {
          DEFAULT: "hsl(221.2 83.2% 53.3%)",
          foreground: "white",
        },
        secondary: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "black",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "black",
        },
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "white",
        },
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(221.2 83.2% 53.3%)",
      },
    },
  },
  plugins: [],
}

