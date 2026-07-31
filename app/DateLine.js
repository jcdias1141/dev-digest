import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarCheckIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "../lib/format";

// A linha de data das páginas: card "Esta semana", edição e novidade.
// Não usar nos cards de listagem — lá a data é metadado de canto, em 12px,
// e o ícone só competiria com o badge de categoria.
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
