import { parseThrowBreak } from './frameParser'

function getStancePrefix(command) {
  const m = command?.match(/^([A-Z0-9]+)\./i)
  return m ? m[1].toUpperCase() : 'BASE'
}

function getResultStance(name) {
  if (!name) return null
  const m = name.match(/\(([A-Z][A-Z0-9]*)\)\s*$/i)
  return m ? m[1].toUpperCase() : null
}

/**
 * Builds chain groups from a character's moves.
 * Returns { chains, standalone }
 * - chains: array of { id, name, rootStance, nodeMap }
 *   nodeMap: stance → { moves: [...], children: [resultStance, ...] }
 * - standalone: moves with throw break but no chain context
 */
export function buildThrowChains(moves) {
  const throwMoves = moves.filter(m => parseThrowBreak(m.notes) !== null)
  if (throwMoves.length === 0) return { chains: [], standalone: [] }

  // Group moves by stance
  const byStance = {}
  for (const m of throwMoves) {
    const stance = getStancePrefix(m.command)
    if (!byStance[stance]) byStance[stance] = []
    byStance[stance].push(m)
  }

  // Build stance → [resultStances] map
  const stanceChildren = {} // stance → Set of resultStances
  for (const [stance, stanceMoves] of Object.entries(byStance)) {
    for (const m of stanceMoves) {
      const result = getResultStance(m.name)
      if (result) {
        if (!stanceChildren[stance]) stanceChildren[stance] = new Set()
        stanceChildren[stance].add(result)
      }
    }
  }

  // All stances that are reached BY another stance's throw
  const isChildStance = new Set()
  for (const children of Object.values(stanceChildren)) {
    for (const c of children) isChildStance.add(c)
  }

  // Root stances = have throws but are not a child of another stance
  const rootStances = Object.keys(byStance).filter(s => !isChildStance.has(s))

  // Build node map recursively for each root
  function buildNodeMap(rootStance, visited = new Set()) {
    if (visited.has(rootStance)) return {}
    visited.add(rootStance)
    const nodeMap = {}
    if (!byStance[rootStance]) return nodeMap

    const children = stanceChildren[rootStance]
      ? [...stanceChildren[rootStance]].filter(c => byStance[c])
      : []

    nodeMap[rootStance] = {
      moves: byStance[rootStance],
      children,
    }

    for (const child of children) {
      Object.assign(nodeMap, buildNodeMap(child, visited))
    }
    return nodeMap
  }

  // Group roots into chains (roots that connect to other stances are chains)
  // Roots with no children and only 1 move are standalone
  const chains = []
  const standalone = []

  // Ground/positional stances to group separately
  const GROUND_STANCES = new Set(['FUFT', 'FUFA', 'FUFL', 'FDFT', 'FDFA', 'FDFL', 'FDFR'])
  const SPECIAL_STANCES = new Set(['AIR', 'WALL', 'BEHIND', 'FC'])

  for (const root of rootStances) {
    const nodeMap = buildNodeMap(root)
    const hasChildren = (stanceChildren[root]?.size ?? 0) > 0
    const stanceMoves = byStance[root] || []

    if (!hasChildren && stanceMoves.length === 1 && root === 'BASE') {
      standalone.push(...stanceMoves)
      continue
    }

    // Name the chain
    let name = root
    if (root === 'BASE') {
      name = 'Throws de base'
    } else if (root === 'CD') {
      name = 'Crouching Dash (CD)'
    } else if (root === 'JGS' || root === 'JGR') {
      name = 'Jaguar Step'
    } else if (GROUND_STANCES.has(root)) {
      name = `Sol (${root})`
    } else if (SPECIAL_STANCES.has(root)) {
      const labels = { AIR: 'Air throws', WALL: 'Wall throws', BEHIND: 'Back throws', FC: 'Full Crouch' }
      name = labels[root] || root
    } else {
      // Use the name of the first move in the stance
      const firstName = stanceMoves[0]?.name || stanceMoves[0]?.command || root
      // Remove trailing parenthetical like "(RAS1)"
      name = firstName.replace(/\s*\([^)]+\)\s*$/, '').trim() || root
    }

    chains.push({ id: root, name, rootStance: root, nodeMap })
  }

  // Also add BASE standalone throws as a group if any
  if (standalone.length > 0) {
    chains.push({
      id: 'STANDALONE',
      name: 'Throws individuels',
      rootStance: 'STANDALONE',
      nodeMap: { STANDALONE: { moves: standalone, children: [] } },
    })
  }

  return { chains }
}

/**
 * Given a chain's nodeMap and a current stance,
 * returns a random move from that stance.
 */
export function pickRandomMove(nodeMap, stance) {
  const node = nodeMap[stance]
  if (!node || node.moves.length === 0) return null
  return node.moves[Math.floor(Math.random() * node.moves.length)]
}

/**
 * Given a move and a nodeMap, returns the next stance (if any).
 */
export function getNextStance(move, nodeMap) {
  const result = getResultStance(move.name)
  if (result && nodeMap[result]) return result
  return null
}
