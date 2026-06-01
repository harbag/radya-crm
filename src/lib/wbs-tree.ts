import type { WbsTaskRow } from '@/lib/queries/wbs'

export const MAX_WBS_DEPTH = 4

export type WbsNode = WbsTaskRow & {
  children: WbsNode[]
  depth: number // 1-based, recomputed from tree position
  wbsCode: string // outline number e.g. "1.2.1"
}

export type FlatRow = WbsNode & {
  hasChildren: boolean
}

/**
 * Build an ordered forest from the flat row list using parent_id, sorting each
 * sibling group by order_index. Orphaned rows (missing parent) are treated as
 * roots so nothing silently disappears.
 */
export function buildTree(rows: WbsTaskRow[]): WbsNode[] {
  const byId = new Map<string, WbsNode>()
  for (const row of rows) {
    byId.set(row.id, { ...row, children: [], depth: 1, wbsCode: '' })
  }

  const roots: WbsNode[] = []
  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sortByOrder = (a: WbsNode, b: WbsNode) =>
    a.order_index - b.order_index || a.created_at.localeCompare(b.created_at)

  const sortRec = (nodes: WbsNode[]) => {
    nodes.sort(sortByOrder)
    for (const n of nodes) sortRec(n.children)
  }
  sortRec(roots)

  return roots
}

/**
 * Assign outline codes ("1", "1.1", "1.1.1") and depth from each node's 1-based
 * position among its siblings. In-memory result is the source of truth for
 * display; the persisted wbs_code column is just a cache.
 */
export function assignWbsCodes(roots: WbsNode[]): void {
  const walk = (nodes: WbsNode[], prefix: string, depth: number) => {
    nodes.forEach((node, i) => {
      node.wbsCode = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
      node.depth = depth
      walk(node.children, node.wbsCode, depth + 1)
    })
  }
  walk(roots, '', 1)
}

/**
 * Pre-order DFS flatten producing the visible row list. Descendants of any node
 * whose id is in `collapsed` are skipped. Both the grid and the Gantt render
 * this exact array so their rows stay aligned and collapse in lockstep.
 */
export function flattenVisible(
  roots: WbsNode[],
  collapsed: Set<string>
): FlatRow[] {
  const out: FlatRow[] = []
  const walk = (nodes: WbsNode[]) => {
    for (const node of nodes) {
      out.push({ ...node, hasChildren: node.children.length > 0 })
      if (node.children.length > 0 && !collapsed.has(node.id)) {
        walk(node.children)
      }
    }
  }
  walk(roots)
  return out
}

/** All descendant ids of a node (excluding the node itself). */
export function getDescendantIds(node: WbsNode): string[] {
  const ids: string[] = []
  const walk = (nodes: WbsNode[]) => {
    for (const n of nodes) {
      ids.push(n.id)
      walk(n.children)
    }
  }
  walk(node.children)
  return ids
}

/** Height of a subtree rooted at node (1 = leaf). */
export function subtreeHeight(node: WbsNode): number {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(subtreeHeight))
}

/**
 * Indent is allowed only when there is a previous visible sibling to nest under
 * AND the deepest descendant of the moved subtree would still fit within
 * MAX_WBS_DEPTH at its new base depth.
 */
export function canIndent(
  node: WbsNode | undefined,
  prevSibling: WbsNode | undefined
): boolean {
  if (!node || !prevSibling) return false
  const newBaseDepth = prevSibling.depth + 1
  return newBaseDepth - 1 + subtreeHeight(node) <= MAX_WBS_DEPTH
}

/** Outdent is allowed for any node deeper than layer 1. */
export function canOutdent(node: WbsNode | undefined): boolean {
  return !!node && node.depth > 1
}

/** Find a node anywhere in the forest by id. */
export function findNode(roots: WbsNode[], id: string): WbsNode | undefined {
  for (const node of roots) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return undefined
}

/** The ordered sibling list a node belongs to. */
export function siblingsOf(roots: WbsNode[], node: WbsNode): WbsNode[] {
  if (!node.parent_id) return roots
  const parent = findNode(roots, node.parent_id)
  return parent ? parent.children : roots
}
