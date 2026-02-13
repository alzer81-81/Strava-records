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
        blaze: "#FC5200",
        volt: "#7CFC00",
        coral: "#FF6B57",
        sprint: "#2F6BFF",
        moss: "#14532D",
        slateish: "#1F2937"
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.05)",
        soft: "0 6px 16px rgba(0,0,0,0.08)",
        punch: "0 14px 36px rgba(0,0,0,0.14)"
      }
    }
  },
  plugins: []
};
