// src/composables/useGameBoard.ts
import { ref, computed, watch } from "vue";
import type { Game, Position, CollapsedThread, Tile } from "@/types";

// you can also export your offsets array here
const offsets: Position[] = [
  { x: 0, y: -1 }, // 0: top
  { x: 1, y: -1 }, // 1: top-right
  { x: 1, y: 0 }, // 2: right
  { x: 1, y: 1 }, // 3: bottom-right
  { x: 0, y: 1 }, // 4: bottom
  { x: -1, y: 1 }, // 5: bottom-left
  { x: -1, y: 0 }, // 6: left
  { x: -1, y: -1 }, // 7: top-left
];
export function useGameBoard(
  game: Game,
  collapsedMarkers: Ref<CollapsedThread[]>
) {
  const positions = ref<Record<string, Position>>({});
  const occupancy = ref<Record<string, string>>({});

  // we also track the full set of positions so that width/height never shrink
  const fullPositions = ref<Record<string, Position>>({});

  /** Recompute both full + filtered BFS maps */
  function buildGameBoard() {
    const pmFull: Record<string, Position> = { "0": { x: 0, y: 0 } };
    const occFull: Record<string, string> = { "0,0": "0" };
    const queue = ["0"];

    while (queue.length) {
      const pid = queue.shift()!;
      const ppos = pmFull[pid];
      const pTile = game.gameBoard[pid];

      for (const cid of pTile.children) {
        const child = game.gameBoard[cid];
        if (child.parentEdge == null) continue;
        const off = offsets[child.parentEdge];
        const cpos = { x: ppos.x + off.x, y: ppos.y + off.y };
        pmFull[cid] = cpos;
        occFull[`${cpos.x},${cpos.y}`] = cid;
        queue.push(cid);
      }
    }

    // record the full map
    fullPositions.value = pmFull;

    // build a Set of all IDs to exclude (collapsed subtrees)
    const excluded = new Set<string>(
      collapsedMarkers.value.flatMap((m) => m.tiles.map((t) => t.tileId))
    );

    // filter into the public (positions / occupancy) maps
    const pmFilt: Record<string, Position> = {};
    const occFilt: Record<string, string> = {};
    for (const [id, pos] of Object.entries(pmFull)) {
      if (excluded.has(id)) continue;
      pmFilt[id] = pos;
      occFilt[`${pos.x},${pos.y}`] = id;
    }
    positions.value = pmFilt;
    occupancy.value = occFilt;
  }

  // run on initial load and whenever gameBoard or collapsedMarkers change
  watch(() => [game.gameBoard, collapsedMarkers.value], buildGameBoard, {
    immediate: true,
    deep: true,
  });

  // for your v-for
  const tilePositions = computed(() =>
    Object.entries(positions.value).map(([tid, pos]) => ({
      tile: game.gameBoard[tid] as Tile,
      pos,
    }))
  );

  const PADDING = 1;

  // compute grid bounds *from the full tree*
  const xs = computed(() => Object.values(fullPositions.value).map((p) => p.x));
  const ys = computed(() => Object.values(fullPositions.value).map((p) => p.y));
  const minX = computed(() => Math.min(...xs.value));
  const maxX = computed(() => Math.max(...xs.value));
  const minY = computed(() => Math.min(...ys.value));
  const maxY = computed(() => Math.max(...ys.value));

  const width  = computed(() => (maxX.value - minX.value + 1) + PADDING * 2)
  const height = computed(() => (maxY.value - minY.value + 1) + PADDING * 2)

  // for CSS‐grid 1-based indexing
  const offsetX = computed(() => PADDING + 1 - minX.value);
  const offsetY = computed(() => PADDING + 1 - minY.value);

  return {
    tilePositions,
    positions,
    occupancy,
    buildGameBoard,
    offsets,
    width,
    height,
    offsetX,
    offsetY,
  };
}