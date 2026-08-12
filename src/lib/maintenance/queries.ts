import { db } from "@/lib/db";
import { freshnessFor, sortByFaded, type MaintenanceCard } from "./freshness";

export async function getMaintenanceCards(
  userId: string,
): Promise<MaintenanceCard[]> {
  const items = await db.maintenanceItem.findMany({
    where: { userId, archivedAt: null },
    include: {
      logs: { orderBy: { doneAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const cards = items.map((item) => {
    const lastDoneAt = item.logs[0]?.doneAt ?? null;
    return {
      id: item.id,
      name: item.name,
      intervalDays: item.intervalDays,
      lastDoneAt,
      freshness: freshnessFor(lastDoneAt, item.intervalDays),
    };
  });

  return sortByFaded(cards);
}
