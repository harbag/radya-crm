import {
  DEALS,
  DEAL_STAGES,
  CONTACTS,
  formatCurrency,
  type Deal,
  type DealStage,
} from "@/lib/mock-data";

const STAGE_COLORS: Record<DealStage, { header: string; card: string; dot: string }> = {
  prospecting: {
    header: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    card: "border-blue-100 dark:border-blue-900/50",
    dot: "bg-blue-400",
  },
  proposal: {
    header: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
    card: "border-yellow-100 dark:border-yellow-900/50",
    dot: "bg-yellow-400",
  },
  negotiation: {
    header: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
    card: "border-orange-100 dark:border-orange-900/50",
    dot: "bg-orange-400",
  },
  closed_won: {
    header: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    card: "border-green-100 dark:border-green-900/50",
    dot: "bg-green-400",
  },
  closed_lost: {
    header: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    card: "border-red-100 dark:border-red-900/50",
    dot: "bg-red-400",
  },
};

function DealCard({ deal }: { deal: Deal }) {
  const contact = CONTACTS.find((c) => c.id === deal.contactId);
  const colors = STAGE_COLORS[deal.stage];

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900 ${colors.card}`}
    >
      <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
        {deal.title}
      </p>

      <p className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        {formatCurrency(deal.value)}
      </p>

      {contact && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <span className="text-xs text-zinc-500">{contact.name}</span>
        </div>
      )}

      {deal.notes && (
        <p className="mb-3 text-xs text-zinc-400 line-clamp-2">{deal.notes}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <span>Close:</span>
        <span>
          {new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  deals,
}: {
  stage: { id: DealStage; label: string };
  deals: Deal[];
}) {
  const colors = STAGE_COLORS[stage.id];
  const total = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div
        className={`mb-3 rounded-lg border px-4 py-3 ${colors.header}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {stage.label}
            </span>
          </div>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-xs font-medium text-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-400">
            {deals.length}
          </span>
        </div>
        {deals.length > 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            {formatCurrency(total)}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {deals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
            No deals
          </div>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const dealsByStage = DEAL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = DEALS.filter((d) => d.stage === stage.id);
      return acc;
    },
    {} as Record<DealStage, Deal[]>
  );

  const totalPipeline = DEALS.filter(
    (d) => d.stage !== "closed_lost"
  ).reduce((sum, d) => sum + d.value, 0);

  const closedWonTotal = DEALS.filter((d) => d.stage === "closed_won").reduce(
    (sum, d) => sum + d.value,
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Deals Pipeline
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {DEALS.length} deals across {DEAL_STAGES.length} stages
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Total Pipeline
          </p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalPipeline)}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
            Closed Won
          </p>
          <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(closedWonTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Active Deals
          </p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {
              DEALS.filter(
                (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {DEAL_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
