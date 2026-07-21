<template>
  <div class="mx-auto overflow-visible w-full h-full">
    <div id="game-board" class="grid justify-items-center items-center w-fit h-fit mx-auto relative
             grid-cols-[repeat(var(--cols),_14rem)]
             grid-rows-[repeat(var(--rows),_14rem)]" @mouseleave="() => handleHover(null)"
      :style="{ '--cols': width, '--rows': height, '--cell': '14rem' }">
      <TopicTile v-if="!hideTopicTile" :topic="topicTile.text" :isTopicRevisionOpen="isTopicRevisionOpen"
        :topicProposal="topicProposal" @propose-topic-revision="revision => handleTopicProposal(revision)" @close-topic-revision="handleCloseTopicRevision" @reject-topic-proposal="handleRejectTopicProposal"
        @topic-revise="revision => handleTopicRevise(revision)" :style="{
          gridColumnStart: topicPos.x + offsetX,
          gridRowStart: topicPos.y + offsetY,
        }" />

      <Tile v-for="({ tile, pos }) in safeNonRootTilePositions" :key="tile.tileId" :tile="tile" :userRole="myRole"
        :side="(pos?.x ?? 0) <= 0 ? 'left' : 'right'"
        :parentRole="tile.parentId ? game.gameBoard[tile.parentId].player : null"
        :disableInteractions="disableInteractions"
        :demoMode="demoMode"
        :demoEditingTileId="demoEditingTileId"
        :isBeingEvaluated="evaluatingTileId === tile.tileId"
        :initialDraft="draftsByTileId?.[tile.tileId] ?? ''"
        @hovering="() => handleHover(tile.tileId)" @typing="partial => handleTyping(tile.tileId, partial)"
        @confirm="text => handleConfirm(tile.tileId, text)" @emoji-place="emoji => handlePlaceEmoji(tile.tileId, emoji)"
        @rule-card-place="card => handlePlaceRuleCard(tile.tileId, card)"
        @remove="() => emit('tile-remove', { tileId: tile.tileId })"
        @tile-revise="text => handleReviseTile(tile.tileId, text)" :style="{
          gridColumnStart: (pos?.x ?? 0) + offsetX,
          gridRowStart: (pos?.y ?? 0) + offsetY,
        }" />

      <!-- Collapsed tiles -->
      <CollapsedThread v-for="t in safeCollapsedThreads" :key="`ct-${t.parentId}-${t.childId}`" :thread="t" :style="{
        gridColumnStart: (t.pos?.x ?? 0) + offsetX,
        gridRowStart: (t.pos?.y ?? 0) + offsetY,
      }" :userRole="myRole" @undo-place-emoji="handleUndoPlaceEmoji"/>

      <!-- Hover targets -->
      <TileShape v-for="(pos, idx) in safeHoverPositions" :key="`hover-${idx}`" :size="12"
        :color="myRole === 'plus' ? 'green' : 'orange'" @click="() => handleTilePlace({ pos })" :style="{
          gridColumnStart: (pos?.x ?? 0) + offsetX,
          gridRowStart: (pos?.y ?? 0) + offsetY,
          opacity: 0.5
        }" />

      <!-- Bridge dots -->
      <div v-for="(d, i) in bridgeDots" :key="`dot-${i}`" class="absolute rounded-full z-20 pointer-events-none" :style="{
        left: d.left,
        top: d.top,
        width: '1rem',
        height: '1rem',
        backgroundColor: d.color,
        transform: 'translate(-50%, -50%)',
        boxShadow: `0 0 0 2px white` // optional halo for contrast
      }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Tile from './Tile.vue'
import type { CollapsedThread, Game, Position, Tile as TileType } from '../types'
import { useAlerts } from '@/composables/useAlerts'
const { error } = useAlerts()

const props = defineProps<{
  game: Game
  myRole: 'plus' | 'minus' | null
  isTopicRevisionOpen: boolean
  topicProposal: string,
  hideTopicTile: boolean
  disableInteractions?: boolean
  demoMode?: boolean
  demoEditingTileId?: string | null
  draftsByTileId?: Record<string, string>
  evaluatingTileId?: string | null
}>()

const emit = defineEmits<{
  (e: 'tile-hover', tileId: string | null): void
  (e: 'tile-typing', payload: { tileId: string; partial: string }): void
  (e: 'tile-confirm', payload: { tileId: string; text: string }): void
  (e: 'tile-place', payload: { parentId: string; parentEdge: number; pos: Position }): void
  (e: 'tile-remove', payload: { tileId: string }): void
  (e: 'emoji-place', payload: { tileId: string; emoji: string | null }): void
  (e: 'undo-emoji-place', payload: { tileId: string}): void
  (e: 'rule-card-place', payload: { tileId: string; card: string }): void
  (e: 'update-resolved-threads', payload: { thread: number, emoji: 'wine' | 'thumbs-up' | 'shared-facts' | 'scale' }): void
  (e: 'propose-topic-revision', revision: string): void
  (e: 'close-topic-revision'): void
  (e: 'tile-revise', payload: { tileId: string; text: string }): void
  (e: 'topic-revise', payload: string): void
  (e: 'reject-topic-proposal'): void
}>()

const hoveredTile = ref<string | null>(null)
const collapsedThreads = ref<CollapsedThread[]>([])

const {
  tilePositions,
  positions,
  occupancy,
  buildGameBoard,
  offsets,
  width,
  height,
  offsetX,
  offsetY
} = useGameBoard(props.game, collapsedThreads)

const topicTile = computed(() => props.game.gameBoard['0'])
const topicPos = computed(() => positions.value?.['0'])


const nonRootTilePositions = computed(() =>
  tilePositions.value.filter(({ tile }) => tile.tileId !== '0')
)
// ensures only diagonal placements
const placeableOffsets = computed(() =>
  offsets.filter(({ x, y }) => x !== 0 && y !== 0)
)
const bridgeDots = computed(() => {
  if (!hoveredTile.value) return []
  const parentId = hoveredTile.value
  const p = positions.value[parentId]
  if (!p) return []

  const color = props.myRole === 'plus' ? '#49CA81' : '#FFB42F'
  const t = 0.55

  // 1-based grid line where each tile starts
  const parentCol = p.x + offsetX.value
  const parentRow = p.y + offsetY.value

  // Helper: center (in "grid cells") = startLine - 0.5
  const centerUnits = (startLine: number) => startLine - 0.5
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  return hoverPositions.value.map(target => {
    const targetCol = target.x + offsetX.value
    const targetRow = target.y + offsetY.value

    const parentColU = centerUnits(parentCol)
    const parentRowU = centerUnits(parentRow)
    const targetColU = centerUnits(targetCol)
    const targetRowU = centerUnits(targetRow)

    //  lerp in grid-units, then multiply by cell size via var(--cell)
    const colU = lerp(parentColU, targetColU, t)
    const rowU = lerp(parentRowU, targetRowU, t)

    return {
      left: `calc(${colU} * var(--cell))`,
      top: `calc(${rowU} * var(--cell))`,
      color
    }
  })
})

function getThreadRootFor(tileId: string): string {
  let id = tileId
  let parent = props.game.gameBoard[id].parentId
  while (parent && parent !== '0') {
    id = parent
    parent = props.game.gameBoard[id].parentId
  }
  return id
}

function isThreadFullyConfirmed(tileId: string): boolean {
  const root = getThreadRootFor(tileId)
  const nodes = collectSubtree(root) // you already have this helper
  return nodes.every(t => t.confirmed === true)
}

function collectSubtree(rootId: string): TileType[] {
  const out: TileType[] = []
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    const t = props.game.gameBoard[id]
    out.push(t)
    queue.push(...t.children)
  }
  return out
}
function collapseThreads() {
  const markers: CollapsedThread[] = []
  const emittedThreads = new Set<number>()

  // Avoid duplicate markers if multiple tiles in the same thread have emojis
  const seenDirectChildren = new Set<string>()

  for (const [tileId, tile] of Object.entries(props.game.gameBoard)) {
    if (!tile.emoji) continue

    // Always collapse all the way to the topic tile (root '0')
    const target = '0'
    const directChild = getThreadRootFor(tileId)
    if (!directChild || seenDirectChildren.has(directChild)) continue
    seenDirectChildren.add(directChild)

    // Which edge connects that direct child to the root?
    const edge = props.game.gameBoard[directChild].parentEdge!
    if (edge == null) continue

    // Everything under that direct child is part of the collapsed thread
    const subtree = collectSubtree(directChild)

    // (Optional) keep safety check — handlePlaceEmoji already enforces full confirmation
    const isFullyConfirmed = subtree.every(t => t.confirmed)
    if (!isFullyConfirmed) continue

    const parentPos = positions.value[target]
    if (!parentPos) continue

    const off = offsets[edge]
    const pos: Position = { x: parentPos.x + off.x, y: parentPos.y + off.y }

    markers.push({ parentId: target, childId: directChild, edge, tiles: subtree, pos })

    // Preserve your existing “resolved threads” emission logic if you rely on ids 1..4
    const childIdNum = Number(directChild)
    if (childIdNum >= 1 && childIdNum <= 4) {
      emittedThreads.add(childIdNum)
      if (tile.emoji) {
        emit('update-resolved-threads', { thread: childIdNum, emoji: tile.emoji as 'wine' | 'thumbs-up' | 'shared-facts' | 'scale' })
      }
    }
  }

  collapsedThreads.value = markers
  buildGameBoard()
}

// rebuild whenever the game board changes
watch(
  () => props.game.gameBoard,
  () => {
    buildGameBoard()
    collapseThreads()
  },
  { immediate: true, deep: true }
)

const hoverPositions = computed<Position[]>(() => {
  if (!hoveredTile.value) return []
  const parentId = hoveredTile.value
  const parentPos = positions.value[parentId]
  const parentTile = props.game.gameBoard[parentId]

  if (!parentPos) return []
  if (!parentTile?.text) return []

  const spots: Position[] = []

  placeableOffsets.value.forEach((off, edge) => {
    const sibCount = parentTile.children.filter(
      (cid: string) => props.game.gameBoard[cid].parentEdge === offsets.findIndex(o => o.x === off.x && o.y === off.y)
    ).length
    if (sibCount >= 2) return

    const target = { x: parentPos.x + off.x, y: parentPos.y + off.y }
    const key = `${target.x},${target.y}`
    if (occupancy.value[key]) return

    const hasOther = offsets.some(nOf => {
      const nx = target.x + nOf.x, ny = target.y + nOf.y
      const occ = occupancy.value[`${nx},${ny}`]
      return occ != null && occ !== parentId
    })
    if (hasOther) return

    spots.push(target)
  })
  return spots
})

function computeEdge(parentPos: Position, childPos: Position): number {
  const idx = offsets.findIndex(
    ({ x, y }) => childPos.x - parentPos.x === x && childPos.y - parentPos.y === y
  )
  if (idx === -1) return -1
  const off = offsets[idx]
  // rejects orthogonal placements
  if (off.x === 0 || off.y === 0) return -1
  return idx
}

const safeNonRootTilePositions = computed(() =>
  nonRootTilePositions.value.filter(
    (e) => e?.pos && Number.isFinite(e.pos.x) && Number.isFinite(e.pos.y) && e.tile
  )
)

const safeCollapsedThreads = computed(() =>
  collapsedThreads.value.filter(
    (t) => t?.pos && Number.isFinite(t.pos.x) && Number.isFinite(t.pos.y)
  )
)

const safeHoverPositions = computed(() =>
  props.disableInteractions
    ? []
    : hoverPositions.value.filter(
        (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)
      )
)



// ===== Event proxies =====
function handleHover(id: string | null) {
  if (id === '0') return
  hoveredTile.value = id
  emit('tile-hover', id)
}

function handleTyping(tileId: string, partial: string) {
  emit('tile-typing', { tileId, partial })
}

function handleConfirm(tileId: string, text: string) {
  emit('tile-confirm', { tileId, text })
}

function handleTilePlace({ pos }: { pos: Position }) {
  if (props.disableInteractions) return
  if (!hoveredTile.value) return
  const edge = computeEdge(positions.value[hoveredTile.value], pos)
  if (edge === -1) return // only allow placements that match one of the neighbor offsets
  emit('tile-place', { parentId: hoveredTile.value, parentEdge: edge, pos })
}

async function handlePlaceEmoji(tileId: string, emoji: string) {
  const rootTileId = getThreadRootFor(tileId)
  const rootTile = props.game.gameBoard[rootTileId]
  if(!isThreadFullyConfirmed(tileId)) {
    error('Cannot resolve thread with unconfirmed tiles')
    return
  }
  rootTile.emoji = emoji
  await nextTick()
  collapseThreads()
  emit('emoji-place', { tileId: rootTileId, emoji: rootTile.emoji })
}

function handleUndoPlaceEmoji(tileId: string) {
  props.game.gameBoard[tileId].emoji = null
  collapseThreads()
  emit('undo-emoji-place', { tileId })
}

function handlePlaceRuleCard(tileId: string, card: string) {
  const tile = props.game.gameBoard[tileId]
  tile.ruleCard = card
  tile.revised = false
  tile.confirmed = false
  emit('rule-card-place', { tileId, card })
}

function handleTopicProposal(revision: string) {
  emit('propose-topic-revision', revision)
}

function handleCloseTopicRevision() {
  emit('close-topic-revision')
}

function handleReviseTile(tileId: string, text: string) {
  const tile = props.game.gameBoard[tileId]
  tile.text = text
  tile.confirmed = true
  tile.revised = true
  emit('tile-revise', { tileId, text })
}

function handleRejectTopicProposal() {
  emit('reject-topic-proposal')
}

function handleTopicRevise(revision: string) {
  emit('topic-revise', revision)
}
</script>
