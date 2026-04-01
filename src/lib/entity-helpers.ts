import type { EntityType, Task, Note, Activity } from "./types";

/**
 * Get tasks linked to a specific entity.
 */
export function getLinkedTasks(
  tasks: Task[],
  entityType: EntityType,
  entityId: string
): Task[] {
  return tasks.filter(
    (t) => t.linkedEntityType === entityType && t.linkedEntityId === entityId
  );
}

/**
 * Get notes linked to a specific entity.
 */
export function getLinkedNotes(
  notes: Note[],
  entityType: EntityType,
  entityId: string
): Note[] {
  return notes
    .filter(
      (n) => n.linkedEntityType === entityType && n.linkedEntityId === entityId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Get activity feed for an entity, sorted newest first.
 */
export function getActivityFeed(
  activities: Activity[],
  entityType: EntityType,
  entityId: string
): Activity[] {
  return activities
    .filter(
      (a) =>
        a.linkedEntityType === entityType && a.linkedEntityId === entityId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Get all activities sorted newest first (for dashboard).
 */
export function getAllActivitiesSorted(activities: Activity[]): Activity[] {
  return [...activities].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
