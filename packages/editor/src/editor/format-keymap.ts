import { EditorSelection, type StateCommand } from "@codemirror/state"
import { keymap } from "@codemirror/view"

/** Wraps each selection in `marker`, or unwraps it if already wrapped. */
function toggleMark(marker: string): StateCommand {
  const n = marker.length

  return ({ state, dispatch }) => {
    const isMarker = (pos: number) => state.sliceDoc(pos, pos + n) === marker
    const isRunEnd = (pos: number) => state.sliceDoc(pos, pos + 1) !== marker[0]

    const unwrap = (open: number, close: number) => ({
      changes: [
        { from: open, to: open + n },
        { from: close, to: close + n },
      ],
      range: EditorSelection.range(open, close - n),
    })

    const tr = state.changeByRange(({ from, to }) => {
      const wrappedOutside =
        from >= n &&
        isMarker(from - n) &&
        isMarker(to) &&
        isRunEnd(from - n - 1) &&
        isRunEnd(to + n)
      if (wrappedOutside) return unwrap(from - n, to)

      const wrappedInside =
        to - from >= 2 * n &&
        isMarker(from) &&
        isMarker(to - n) &&
        isRunEnd(from + n) &&
        isRunEnd(to - n - 1)
      if (wrappedInside) return unwrap(from, to - n)

      return {
        changes: [
          { from, insert: marker },
          { from: to, insert: marker },
        ],
        range: EditorSelection.range(from + n, to + n),
      }
    })

    dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }))
    return true
  }
}

// stopPropagation: ⌘B also toggles the sidebar from a window listener.
export const formatKeymap = keymap.of(
  [
    { key: "Mod-b", run: toggleMark("**") },
    { key: "Mod-i", run: toggleMark("*") },
    { key: "Mod-e", run: toggleMark("`") },
  ].map((binding) => ({ ...binding, stopPropagation: true }))
)
