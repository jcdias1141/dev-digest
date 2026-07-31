import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarCheckIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "../lib/format";

// A linha de data das páginas: card "Esta semana", edição e novidade.
// Os cards de listagem usam ShortDate (em DigestBrowser.js): mesma anatomia,
// escala menor, e data abreviada.
export default function DateLine({ date, className = "" }) {
  return (
    <p
      className={`inline-flex items-center gap-1.5 text-sm text-neutral-500 ${className}`}
    >
      <HugeiconsIcon
        icon={CalendarCheckIcon}
        size={15}
        strokeWidth={2}
        aria-hidden="true"
      />
      {formatDate(date)}
    </p>
  );
}
