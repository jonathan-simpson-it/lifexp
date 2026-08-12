"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncProgress } from "@/lib/progress/sync";

async function assertOwnsItem(userId: string, itemId: string) {
  const item = await db.maintenanceItem.findUnique({
    where: { id: itemId },
    select: { userId: true },
  });
  if (!item || item.userId !== userId) throw new Error("Item not found");
}

/** Records that the thing was done. There is nothing to "complete" or "miss". */
export async function logMaintenance(itemId: string) {
  const userId = await requireUserId();
  await assertOwnsItem(userId, itemId);

  await db.maintenanceLog.create({ data: { itemId } });
  await syncProgress(userId); // maintenance counts toward the Caretaker badge
  revalidatePath("/", "layout");
}

/** Undo for a mis-tap: removes the most recent log for this item. */
export async function undoLastMaintenance(itemId: string) {
  const userId = await requireUserId();
  await assertOwnsItem(userId, itemId);

  const latest = await db.maintenanceLog.findFirst({
    where: { itemId },
    orderBy: { doneAt: "desc" },
  });
  if (latest) await db.maintenanceLog.delete({ where: { id: latest.id } });

  await syncProgress(userId);
  revalidatePath("/", "layout");
}

export async function createMaintenanceItem(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Give the item a name");

  const intervalDays = Number(formData.get("intervalDays") ?? 7);

  await db.maintenanceItem.create({
    data: {
      userId,
      name,
      intervalDays: Number.isFinite(intervalDays)
        ? Math.min(Math.max(Math.round(intervalDays), 1), 3650)
        : 7,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateMaintenanceInterval(itemId: string, intervalDays: number) {
  const userId = await requireUserId();
  await assertOwnsItem(userId, itemId);

  await db.maintenanceItem.update({
    where: { id: itemId },
    data: { intervalDays: Math.min(Math.max(Math.round(intervalDays), 1), 3650) },
  });

  revalidatePath("/", "layout");
}

/** Archive rather than delete, so the history stays intact. */
export async function archiveMaintenanceItem(itemId: string) {
  const userId = await requireUserId();
  await assertOwnsItem(userId, itemId);

  await db.maintenanceItem.update({
    where: { id: itemId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/", "layout");
}
