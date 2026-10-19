import { useQuery } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"
import * as api from "../api/operations"
import { runtime } from "../runtime"
import type { Board, Card } from "../types"
import { CardTree, subtaskProgress } from "../utils"
import { keys } from "./keys"

const HIDE_SUBTASKS_KEY = "doska:hide-subtasks"

interface BoardTree {
  tree: CardTree<Card>
  doneColumns: ReadonlySet<string>
}

/** One tree per board snapshot, shared by every card reading it. */
const trees = new WeakMap<Board, BoardTree>()

function treeOf(board: Board): BoardTree {
  let built = trees.get(board)
  if (!built) {
    built = {
      tree: new CardTree(board.cards),
      doneColumns: new Set(
        board.columns.filter((c) => c.done).map((c) => c.id)
      ),
    }
    trees.set(board, built)
  }
  return built
}

const EMPTY: BoardTree = { tree: new CardTree([]), doneColumns: new Set() }

/** The board's own query, narrowed: `select` keeps a re-render to the reader. */
function useBoardSelect<T>(deckId: string, select: (board: Board) => T) {
  return useQuery({
    queryKey: keys.board(deckId),
    queryFn: () => api.getBoard(deckId),
    networkMode: "always",
    select,
  }).data
}

/** A board's live cards as a sub-task tree, with the columns that count as done. */
export function useBoardTree(deckId: string): BoardTree {
  return useBoardSelect(deckId, treeOf) ?? EMPTY
}

export interface SubtaskInfo {
  parent: { id: string; title: string } | null
  /** `null` for a card without sub-tasks. */
  progress: { done: number; total: number } | null
}

/** What a board card shows about its place in the tree. */
export function useSubtaskInfo(deckId: string, cardId: string): SubtaskInfo {
  return (
    useBoardSelect(deckId, (board): SubtaskInfo => {
      const { tree, doneColumns } = treeOf(board)
      const parent = tree.parentOf(cardId)
      const children = tree.childrenOf(cardId)
      return {
        parent: parent ? { id: parent.id, title: parent.title } : null,
        progress:
          children.length > 0 ? subtaskProgress(children, doneColumns) : null,
      }
    }) ?? { parent: null, progress: null }
  )
}

let hidden: Record<string, boolean> | null = null

const listeners = new Set<() => void>()

function load(): Record<string, boolean> {
  if (hidden) return hidden
  const stored = runtime().kv.get(HIDE_SUBTASKS_KEY)
  try {
    hidden = stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
  } catch {
    // Unreadable storage is not worth failing a render over.
    hidden = {}
  }
  return hidden
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setHideSubtasks(id: string, hide: boolean): void {
  const current = load()
  if (!!current[id] === hide) return
  hidden = { ...current, [id]: hide }
  runtime().kv.set(HIDE_SUBTASKS_KEY, JSON.stringify(hidden))
  for (const listener of [...listeners]) listener()
}

/** Whether this device hides board `id`'s sub-tasks, leaving top-level cards. */
export function useHideSubtasks(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => load()[id] ?? false,
    () => false
  )
}
