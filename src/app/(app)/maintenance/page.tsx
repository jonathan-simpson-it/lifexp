import { requireUserId } from "@/lib/auth";
import { getMaintenanceCards } from "@/lib/maintenance/queries";
import { MaintenanceList } from "@/components/maintenance-list";
import { createMaintenanceItem } from "@/app/actions/maintenance";

export const metadata = { title: "Maintenance · LifeXP" };

/** Common starting points, so the first item costs no thought. */
const SUGGESTIONS = [
  { name: "Change bedsheets", days: 14 },
  { name: "Vacuum", days: 7 },
  { name: "Water plants", days: 5 },
  { name: "Laundry", days: 7 },
  { name: "Clean the fridge", days: 30 },
  { name: "Call family", days: 7 },
];

export default async function MaintenancePage() {
  const userId = await requireUserId();
  const items = await getMaintenanceCards(userId);

  const existing = new Set(items.map((i) => i.name.toLowerCase()));
  const suggestions = SUGGESTIONS.filter((s) => !existing.has(s.name.toLowerCase()));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-2xl font-semibold">Maintenance</h1>
        <p className="mt-1 text-ink-soft">
          Not a to-do list. LifeXP just remembers when you last did each thing,
          so you don&rsquo;t have to.
        </p>
      </header>

      <MaintenanceList items={items} />

      <section aria-labelledby="add-item" className="card p-4">
        <h2 id="add-item" className="font-medium">
          Add an item
        </h2>
        <p className="mt-1 text-sm text-muted">
          The interval is your own sense of rhythm, not a deadline. Nothing
          happens when it passes. The item just looks a little more faded.
        </p>

        <form action={createMaintenanceItem} className="mt-3 space-y-2">
          <div className="flex gap-2">
            <label htmlFor="item-name" className="sr-only">
              Item name
            </label>
            <input
              id="item-name"
              name="name"
              required
              placeholder="Change bedsheets"
              className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm"
            />
            <label htmlFor="item-interval" className="sr-only">
              Days between
            </label>
            <input
              id="item-interval"
              name="intervalDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              defaultValue={7}
              className="w-20 rounded-full border border-line bg-paper px-3 py-2 text-center text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-muted">days between</p>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs tracking-wide text-muted uppercase">
              Common ones
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <li key={suggestion.name}>
                  <form action={createMaintenanceItem}>
                    <input type="hidden" name="name" value={suggestion.name} />
                    <input
                      type="hidden"
                      name="intervalDays"
                      value={suggestion.days}
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:bg-line/40 hover:text-ink"
                    >
                      + {suggestion.name}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
