import type { WbsTaskRow } from '@/lib/queries/wbs'
import { buildTree, type WbsNode } from '@/lib/wbs-tree'

const WEIGHT_TOLERANCE = 0.01

export type WeightValidation = {
  parentId: string | null // null = root level
  childIds: string[]
  sum: number
  valid: boolean
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * For every group of direct siblings (including the root group), validate that
 * weight_percent sums to 100 (±tolerance). Returns one record per group.
 */
export function validateWeights(roots: WbsNode[]): WeightValidation[] {
  const results: WeightValidation[] = []

  const check = (parentId: string | null, group: WbsNode[]) => {
    if (group.length > 0) {
      const sum = group.reduce((s, n) => s + (n.weight_percent ?? 0), 0)
      results.push({
        parentId,
        childIds: group.map((n) => n.id),
        sum: round(sum),
        valid: Math.abs(sum - 100) <= WEIGHT_TOLERANCE,
      })
    }
    for (const node of group) {
      if (node.children.length > 0) check(node.id, node.children)
    }
  }

  check(null, roots)
  return results
}

/**
 * Compute rolled-up progress for every node via post-order DFS.
 *   leaf   → its own progress_percent
 *   parent → Σ (childRollup × childWeight / 100)
 * Returns a Map keyed by node id. Leaves map to their stored progress.
 */
export function computeRollups(roots: WbsNode[]): Map<string, number> {
  const result = new Map<string, number>()

  const visit = (node: WbsNode): number => {
    if (node.children.length === 0) {
      const p = node.progress_percent ?? 0
      result.set(node.id, p)
      return p
    }
    let acc = 0
    for (const child of node.children) {
      const childProgress = visit(child)
      acc += (childProgress * (child.weight_percent ?? 0)) / 100
    }
    const rolled = round(acc)
    result.set(node.id, rolled)
    return rolled
  }

  for (const root of roots) visit(root)
  return result
}

/**
 * Given the full flat row set and a single leaf edit (progress and/or weight),
 * return the minimal set of updates to persist: the edited row plus every
 * ancestor whose derived progress changed. Recomputes bottom-up to layer 1.
 */
export function rollupUpdatesForEdit(
  rows: WbsTaskRow[],
  edit: { id: string; progress_percent?: number; weight_percent?: number }
): { id: string; progress_percent?: number; weight_percent?: number }[] {
  // Apply the edit to a working copy, then recompute the whole tree.
  const editedRows = rows.map((r) =>
    r.id === edit.id
      ? {
          ...r,
          ...(edit.progress_percent !== undefined
            ? { progress_percent: edit.progress_percent }
            : {}),
          ...(edit.weight_percent !== undefined
            ? { weight_percent: edit.weight_percent }
            : {}),
        }
      : r
  )

  const roots = buildTree(editedRows)
  const rollups = computeRollups(roots)
  const byId = new Map(rows.map((r) => [r.id, r]))

  const updates: {
    id: string
    progress_percent?: number
    weight_percent?: number
  }[] = []

  // The edited leaf itself.
  const leafUpdate: {
    id: string
    progress_percent?: number
    weight_percent?: number
  } = { id: edit.id }
  if (edit.progress_percent !== undefined)
    leafUpdate.progress_percent = edit.progress_percent
  if (edit.weight_percent !== undefined)
    leafUpdate.weight_percent = edit.weight_percent
  updates.push(leafUpdate)

  // Every parent node whose rolled-up progress differs from its stored value.
  const collectParents = (nodes: WbsNode[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        const rolled = rollups.get(node.id) ?? 0
        const stored = byId.get(node.id)?.progress_percent ?? 0
        if (Math.abs(rolled - stored) > WEIGHT_TOLERANCE) {
          updates.push({ id: node.id, progress_percent: rolled })
        }
        collectParents(node.children)
      }
    }
  }
  collectParents(roots)

  return updates
}
