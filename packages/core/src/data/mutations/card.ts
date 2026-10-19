import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { Card } from "../../types"
import { CardTree } from "../../utils"
import { pushUndo } from "../../undo"
import { cardWriteKeys, keys } from "../keys"
import { replaceById, useBoardPatch } from "./board-patch"

/** Takes a column id, or a column plus the tags to start with (a lane's). */
export function useCreateCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (to: string | { columnId: string; tags: string[] }) =>
      typeof to === "string"
        ? api.createCard(to)
        : api.createCard(to.columnId, { tags: to.tags }),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

/** Creates an empty sub-task in its parent's column; resolves to its id. */
export function useCreateSubtask(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (parentId: string) => api.createSubtask(parentId),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

/** Makes a card a sub-task of another on its board, or top-level with `null`. */
export function useSetCardParent(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      api.setCardParent(id, parentId),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      for (const key of cardWriteKeys(id))
        qc.invalidateQueries({ queryKey: key })
    },
  })
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(deckId, id),
    onSuccess: (_data, id) => pushUndo("cards", id),
    onSettled: (_data, _error, id) => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      qc.invalidateQueries({ queryKey: keys.card(id) })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}

export type CardPatch = Partial<
  Pick<
    Card,
    | "title"
    | "body"
    | "deadline"
    | "priority"
    | "tags"
    | "users"
    | "attachments"
    | "bodyConflict"
  >
>

function useCardWrite<V>(
  mutationFn: (vars: V) => Promise<unknown>,
  idOf: (vars: V) => string
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: (_data, _err, vars) => {
      for (const key of cardWriteKeys(idOf(vars)))
        qc.invalidateQueries({ queryKey: key })
    },
  })
}

export function useUpdateCard(id: string) {
  return useCardWrite(
    (patch: CardPatch) => api.updateCard(id, patch),
    () => id
  )
}

/**
 * {@link useUpdateCard} with the card id in the variables rather than bound at
 * hook time, for callers whose target can change while a write is queued — the
 * card panel debounces its writes, so the id has to travel with the patch.
 */
export function useSaveCard() {
  return useCardWrite(
    ({ id, patch }: { id: string; patch: CardPatch }) =>
      api.updateCard(id, patch),
    ({ id }) => id
  )
}

/**
 * Moves one card to the top of a column, for callers outside a board. Every
 * board's cache is refreshed because the digest holds no deck id of its own.
 */
export function useMoveCardToColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, columnId }: { id: string; columnId: string }) =>
      api.moveCardToColumn(id, columnId),
    onSettled: (_data, _err, { id }) => {
      for (const key of cardWriteKeys(id))
        qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: keys.cardCol(id) })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}

/**
 * Persists a reordered board (computed by the drag handler). The cache is
 * written up front not for latency (the write is instant) but for timing:
 * @hello-pangea/dnd needs the new order committed within the drop event.
 *
 * A move can land the card in another column, changing its digest tag — and the
 * open card panel reads its column off the per-card query, so those refresh too
 * or the panel's column picker keeps showing the old column.
 */
export function useMoveCard(deckId: string) {
  return useBoardPatch(
    deckId,
    (changed: Card[]) => api.moveCard(deckId, changed),
    {
      apply: (board, changed) => ({
        ...board,
        cards: replaceById(board.cards, changed),
      }),
      flush: true,
      also: (changed) => [
        keys.digest,
        ...changed.map((card) => keys.card(card.id)),
      ],
    }
  )
}

/** Moves a card off the open board onto another one */
export function useMoveCardToBoard(deckId: string) {
  return useBoardPatch(
    deckId,
    ({ id, boardId }: { id: string; boardId: string }) =>
      api.moveCardToBoard(id, boardId),
    {
      // Its sub-tasks go along with it.
      apply: (board, { id }) => {
        const gone = new Set([
          id,
          ...new CardTree(board.cards).descendantsOf(id).map((c) => c.id),
        ])
        return {
          ...board,
          cards: board.cards.filter((card) => !gone.has(card.id)),
        }
      },
      flush: true,
      also: ({ id, boardId }) => [
        ...cardWriteKeys(id),
        keys.cardCol(id),
        keys.cardDeck(id),
        keys.board(boardId),
        keys.trash,
      ],
    }
  )
}
