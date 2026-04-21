import { PickCard } from "./PickCard.jsx";

export function PickList({ picks }) {
  if (!picks?.length) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-500 dark:border-zinc-300">
        No picks yet.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {picks.map((p) => (
        <PickCard key={p.id} pick={p} />
      ))}
    </div>
  );
}
