module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Söhne é a fonte pretendida, mas é licenciada (Klim Type Foundry) e
        // não vai no repositório — fica em primeiro para valer assim que os
        // .woff2 entrarem em public/fonts (ver globals.css). Quem renderiza
        // hoje é a Inter, carregada pelo next/font em app/layout.js.
        sans: [
          "Söhne",
          "Soehne",
          "var(--font-sans)",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
