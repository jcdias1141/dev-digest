import { Inter } from "next/font/google";
import "./globals.css";

// Substituta livre da Söhne: neo-grotesca, mesma pegada. O next/font baixa no
// build e serve do próprio domínio — sem request a CDN e sem layout shift.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata = {
  title: "Dev Digest",
  description: "Meu digest semanal de novidades de dev com IA",
};

export const viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-neutral-950 font-sans text-neutral-200 antialiased">
        <header className="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-4 px-6 py-4">
            <a href="/" className="group inline-flex items-baseline gap-1.5">
              {/* Destaque tipo marca-texto — #6ad09d é a cor da marca. */}
              <span className="rounded-[3px] bg-[#6ad09d] px-1.5 py-0.5 text-base font-bold tracking-tight text-neutral-950">
                Dev Digest
              </span>
              <span className="text-base font-bold tracking-tight text-neutral-400 transition group-hover:text-neutral-200">
                updates
              </span>
            </a>
            <p className="hidden text-xs text-neutral-500 sm:block">
              Novidades de dev com IA, toda segunda. Leia. Aprenda. Fixe.
            </p>
          </div>
        </header>
        {/* flex-1: empurra o footer para o rodapé em páginas curtas. */}
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
          {children}
        </div>

        <footer className="border-t border-neutral-900">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Feito para quem escreve código e quer acompanhar a IA sem ler
              quarenta newsletters.
            </p>
            <p className="text-xs text-neutral-600">
              Novo digest toda segunda · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
