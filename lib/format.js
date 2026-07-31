// O YAML parseia `2026-08-04` como Date em UTC meia-noite. Sem timeZone: "UTC"
// o formatador converte pro fuso local (UTC-3) e volta um dia.
const TZ = "UTC";

export function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: TZ,
    });
  } catch {
    return d;
  }
}

export function formatShortDate(d) {
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      timeZone: TZ,
    });
  } catch {
    return d;
  }
}

// Sem acento e minúsculo — usado tanto para slug de categoria quanto para o
// índice de busca, pra que "sessao" ache "sessão".
export function normalize(str) {
  return String(str)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function slugify(str) {
  return normalize(str)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
