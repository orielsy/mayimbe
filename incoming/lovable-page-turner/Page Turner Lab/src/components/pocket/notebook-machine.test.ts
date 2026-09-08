import { describe, expect, it } from "vitest";
import { INITIAL, __reducer as reducer, type MachineState } from "./useNotebookMachine";

const T = 8;
const step = (s: MachineState, type: "OPEN" | "CLOSE" | "NEXT" | "PREV") =>
  reducer(s, { type }, T);
const settle = (s: MachineState) =>
  reducer(s, { type: "SETTLE", key: s.turn!.key }, T);

describe("pocket notebook state machine", () => {
  it("starts closed on the front cover", () => {
    expect(INITIAL.status).toBe("closed-front");
  });

  it("opens to page 1 and settles", () => {
    const opening = step(INITIAL, "OPEN");
    expect(opening.status).toBe("opening");
    expect(opening.page).toBe(0);
    expect(settle(opening).status).toBe("open");
  });

  it("ignores input during a transition", () => {
    const opening = step(INITIAL, "OPEN");
    expect(step(opening, "NEXT")).toBe(opening);
    expect(step(opening, "PREV")).toBe(opening);
  });

  it("advances and reverses one logical page at a time", () => {
    let s = settle(step(INITIAL, "OPEN"));
    s = settle(step(s, "NEXT"));
    expect(s.page).toBe(1);
    s = settle(step(s, "PREV"));
    expect(s.page).toBe(0);
  });

  it("closes the cover when going back from page 1", () => {
    const s = settle(step(INITIAL, "OPEN"));
    const closing = step(s, "PREV");
    expect(closing.status).toBe("closing");
    expect(settle(closing).status).toBe("closed-front");
  });

  it("refuses to advance past the final page", () => {
    let s = settle(step(INITIAL, "OPEN"));
    for (let i = 0; i < T - 1; i++) s = settle(step(s, "NEXT"));
    expect(s.page).toBe(T - 1);
    expect(step(s, "NEXT")).toBe(s);
  });

  it("clears the transient turn layer on settle", () => {
    const s = settle(step(INITIAL, "OPEN"));
    expect(s.turn).toBeNull();
  });

  it("ignores stale settle keys", () => {
    const opening = step(INITIAL, "OPEN");
    expect(reducer(opening, { type: "SETTLE", key: 999 }, T)).toBe(opening);
  });
});
