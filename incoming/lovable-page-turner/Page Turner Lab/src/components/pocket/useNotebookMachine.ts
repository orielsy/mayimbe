/* Stage 2 — explicit deterministic notebook state model.
   Settled states: "closed-front" and "open". Every other status is transient
   and carries a `turn` descriptor for the temporary animation layer.
   The resting page is committed BEFORE the animation runs, so the settled
   view never depends on an animation's final frame. */

import { useCallback, useMemo, useReducer } from "react";

export type NotebookStatus =
  | "closed-front"
  | "opening"
  | "open"
  | "turning-forward"
  | "turning-backward"
  | "closing"
  | "closing-back"
  | "closed-back"
  | "opening-back";

export type TurnKind = "open" | "close" | "forward" | "backward" | "close-back" | "open-back";

export interface Turn {
  /** bumped on every transition so React remounts the transient layer */
  key: number;
  kind: TurnKind;
  /** page index shown on the leaving face (-1 = cover) */
  from: number;
  /** page index shown on the arriving face (-1 = cover) */
  to: number;
}

export interface MachineState {
  status: NotebookStatus;
  /** index of the resting page currently committed to the DOM */
  page: number;
  turn: Turn | null;
  seq: number;
}

type Action =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SETTLE"; key: number };

export const isSettled = (s: NotebookStatus) =>
  s === "closed-front" || s === "open" || s === "closed-back";

function reducer(state: MachineState, action: Action, total: number): MachineState {
  const settled = isSettled(state.status);

  switch (action.type) {
    case "OPEN": {
      if (!settled || state.status !== "closed-front") return state;
      const seq = state.seq + 1;
      return {
        status: "opening",
        page: 0,
        seq,
        turn: { key: seq, kind: "open", from: -1, to: 0 },
      };
    }
    case "CLOSE": {
      if (!settled || state.status !== "open") return state;
      const seq = state.seq + 1;
      return {
        status: "closing",
        page: 0,
        seq,
        turn: { key: seq, kind: "close", from: 0, to: -1 },
      };
    }
    case "NEXT": {
      if (state.status === "closed-front") return reducer(state, { type: "OPEN" }, total);
      if (state.status !== "open") return state;
      /* the dedication pastedown is the final right "page" (index === total)
         and is where the notebook ends — nothing turns past it */
      if (state.page >= total) return state;
      const seq = state.seq + 1;
      return {
        status: "turning-forward",
        page: state.page + 1,
        seq,
        turn: { key: seq, kind: "forward", from: state.page, to: state.page + 1 },
      };
    }
    case "PREV": {
      /* going back from the closed back cover re-opens it onto the last page */
      if (state.status === "closed-back") {
        const seq = state.seq + 1;
        return {
          status: "opening-back",
          page: state.page,
          seq,
          turn: { key: seq, kind: "open-back", from: -2, to: state.page },
        };
      }
      if (state.status !== "open") return state;
      if (state.page === 0) return reducer(state, { type: "CLOSE" }, total);
      const seq = state.seq + 1;
      return {
        status: "turning-backward",
        page: state.page - 1,
        seq,
        turn: { key: seq, kind: "backward", from: state.page, to: state.page - 1 },
      };
    }
    case "SETTLE": {
      if (!state.turn || state.turn.key !== action.key) return state;
      return {
        ...state,
        status:
          state.turn.kind === "close"
            ? "closed-front"
            : state.turn.kind === "close-back"
              ? "closed-back"
              : "open",
        turn: null,
      };
    }
    default:
      return state;
  }
}

export const INITIAL: MachineState = {
  status: "closed-front",
  page: 0,
  turn: null,
  seq: 0,
};

export function useNotebookMachine(total: number) {
  const [state, dispatch] = useReducer(
    (s: MachineState, a: Action) => reducer(s, a, total),
    INITIAL,
  );

  const open = useCallback(() => dispatch({ type: "OPEN" }), []);
  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const settle = useCallback((key: number) => dispatch({ type: "SETTLE", key }), []);

  const busy = !isSettled(state.status);

  const flags = useMemo(
    () => ({
      busy,
      canNext:
        state.status === "closed-front" ||
        (state.status === "open" && state.page < total),
      canPrev: state.status === "open" || state.status === "closed-back",
      atEnd: state.status === "open" && state.page >= total,
    }),
    [busy, state.status, state.page, total],
  );

  return { state, open, close, next, prev, settle, ...flags };
}

/** exported for unit tests */
export const __reducer = reducer;
