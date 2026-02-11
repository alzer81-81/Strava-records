/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E11",
        sand: "#F6F2EA",
        ember: "#F97316",
        moss: "#14532D",
        slateish: "#1F2937"
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.08)",
        soft: "0 6px 16px rgba(0,0,0,0.12)"
      }
    }
  },
  plugins: []
};
