/* Stage 2 — functional mobile-first pocket notebook.
   HTML + CSS + static Stage 1 images + live DOM text. No canvas, no WebGL. */

import { useCallback, useEffect, useRef, useState } from "react";
import { PAGES } from "./pages";
import { useNotebookMachine, type Turn } from "./useNotebookMachine";
import { BackCoverInside, BackCoverOutside, CoverFront, CoverInside, PageContent, Sheet } from "./PageSurface";
import { PageStack } from "./PageStack";
import { sheetWear } from "./wear";
import { useAssetsReady } from "./useAssetsReady";


const TOTAL = PAGES.length;
const COVER_MS = 620;
const PAGE_MS = 460;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function TurnFace({
  index,
  back = false,
  padPage = false,
}: {
  index: number;
  back?: boolean;
  padPage?: boolean;
}) {
  const page = PAGES[index];
  return (
    <div
      className="pn-face absolute inset-0"
      style={back ? { transform: "rotateY(180deg)" } : undefined}
    >
      {index === -2 ? (
        back ? (
          /* exterior in flight: pn-mirror + the face's own rotateY(180) cancel
             out, so the board lands on the left half reading exactly like the
             resting closed-back board */
          <div className="pn-mirror absolute inset-0">
            <BackCoverOutside />
          </div>
        ) : (
          /* the dedication pastedown faces up at the start of the closing
             swing and at the end of the opening one — identical to rest */
          <BackCoverInside />
        )
      ) : index < 0 ? (
        back ? (
          /* The leaf's rotateY(180) already un-mirrors this face, so the board
             artwork must be mirrored here to match the resting left leaf. */
          <>
          <div className="pn-mirror absolute inset-0">
            <CoverInside />
          </div>
          {/* At rest the open inside cover is darkened near the spine by the
             right book's soft drop-shadow bleeding over it. The flying leaf is
             inside that same book, so it never receives the shadow — it pops
             in on landing. Paint an equivalent gradient on the inside face;
             the face's own rotateY(180) flips its axes, so the spine side of
             this face is its local RIGHT edge. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-black/30 to-transparent"
          />
          </>
        ) : (
          <CoverFront />
        )
      ) : page ? (
        <div
          className={
            padPage ? "absolute inset-[1.6%_2.2%_2%_2.2%]" : "absolute inset-0"
          }
        >
          {back ? (
            /* same handedness as the resting verso: paper mirrored, text not */
            <div className="pn-mirror absolute inset-0">
              <Sheet wear={sheetWear(page.n, TOTAL)}>
                <div className="pn-mirror absolute inset-0">
                  <PageContent page={page} total={TOTAL} />
                </div>
              </Sheet>
            </div>
          ) : (
            <Sheet wear={sheetWear(page.n, TOTAL)}>
              <PageContent page={page} total={TOTAL} />
            </Sheet>
          )}
        </div>
      ) : null}

    </div>
  );
}

function TurningSheet({
  turn,
  reduced,
  onDone,
}: {
  turn: Turn;
  reduced: boolean;
  onDone: (key: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shadeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    const isCover = turn.kind !== "forward" && turn.kind !== "backward";
    const duration = reduced ? 0 : isCover ? COVER_MS : PAGE_MS;
    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDone(turn.key);
    };

    if (!el || duration === 0) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    const from =
      turn.kind === "open" || turn.kind === "open-back"
        ? 0
        : turn.kind === "close" || turn.kind === "close-back"
          ? -168
          : turn.kind === "forward"
            ? 0
            : -180;
    const to =
      turn.kind === "open" || turn.kind === "open-back"
        ? -168
        : turn.kind === "close" || turn.kind === "close-back"
          ? 0
          : turn.kind === "forward"
            ? -180
            : 0;

    const anim = el.animate(
      [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }],
      { duration, easing: "cubic-bezier(0.34, 0.08, 0.2, 1)", fill: "forwards" },
    );
    /* the leaf shading must be gone the instant the leaf lands, otherwise the
       hand-off to the resting page reads as a brightness pop */
    const shadeAnim = shadeRef.current?.animate(
      [{ opacity: 0 }, { opacity: 0.75, offset: 0.5 }, { opacity: 0 }],
      { duration, easing: "linear", fill: "forwards" },
    );
    anim.onfinish = finish;
    // safety net: never let a dropped frame or a lost animation strand the UI
    const timer = window.setTimeout(finish, duration + 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      anim.cancel();
      shadeAnim?.cancel();
    };
  }, [turn, reduced, onDone]);

  /* One physical leaf: the same sheet is on both faces, so wherever it comes to
     rest (right side going back, left side going forward) it matches the spread. */
  /* open/close fly the front cover (-1); close-back/open-back fly the back
     board (-2); page turns fly a paper sheet */
  const leaf =
    turn.kind === "open" || turn.kind === "close"
      ? -1
      : turn.kind === "close-back" || turn.kind === "open-back"
        ? -2
        : turn.kind === "backward"
          ? turn.to
          : turn.from;
  const front = leaf;
  const back = leaf;
  const startDeg =
    turn.kind === "close" || turn.kind === "close-back"
      ? -168
      : turn.kind === "backward"
        ? -180
        : 0;

  /* The hinge is the SPINE — the book box's left edge. The leaf therefore always
     spans the full book box and carries the page inset inside it (the inset is
     horizontally symmetric, so the mirrored back face lands on the left leaf
     exactly where the resting verso page sits). Rotating an already-inset box
     would place the axis ~2% inside the spine and make the page jump on landing. */
  return (
    <div
      ref={ref}
      data-turning={turn.kind}
      className="pn-turn absolute inset-0 z-40"
      style={{ transform: `rotateY(${startDeg}deg)` }}
      aria-hidden="true"
    >
      <TurnFace index={front} padPage />
      <TurnFace index={back} back padPage />
      <span
        ref={shadeRef}
        className="pn-turn-shade pointer-events-none absolute inset-0"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

export function PocketNotebook() {
  const { state, open, next, prev, settle, busy, canNext, canPrev, atEnd } =
    useNotebookMachine(TOTAL);
  const reduced = usePrefersReducedMotion();
  const ready = useAssetsReady();
  /* `closing` is transient: the cover is still in flight, so the OPEN spread must
     stay painted underneath it and the closed cover is revealed only past 90°.
     `closingBack`/`openingBack` are the same dance for the back board. */
  const closing = state.turn?.kind === "close";
  const closingBack = state.turn?.kind === "close-back";
  const openingBack = state.turn?.kind === "open-back";
  const closed = state.status === "closed-front" || state.status === "closing";
  const closedBack = state.status === "closed-back" || state.status === "closing-back";
  const showSpread = state.status !== "closed-front" && state.status !== "closed-back";
  const restIndex =
    state.turn && state.turn.kind === "backward" ? state.turn.from : state.page;
  /* the dedication pastedown is the final right "page" (index === TOTAL) */
  const dedicationRight = restIndex >= TOTAL;
  const page = PAGES[Math.min(state.page, TOTAL - 1)]!;
  /* While turning BACKWARD the arriving page lives on the flipping sheet itself,
     so the resting layer must keep showing the page we are leaving — otherwise the
     destination is already painted underneath and the reveal looks instantaneous. */
  const restPage = PAGES[Math.min(restIndex, TOTAL - 1)]!;
  /* Left leaf: normally the page before the resting one. While a leaf is in
     flight it still shows the OLD left page — the flying leaf lands on top of it. */
  const turningPage =
    state.turn?.kind === "forward" || state.turn?.kind === "backward";
  const leftIndex = restIndex - (turningPage ? 2 : 1);
  const leftPage = leftIndex >= 0 ? PAGES[leftIndex] : null;
  const touch = useRef<{ x: number; y: number } | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!ready) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      }
    },
    [next, prev, ready],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    const t = e.changedTouches[0];
    touch.current = null;
    if (!start || !t || !ready) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  const status = !ready
    ? "Preparing the notebook…"
    : closed
      ? "Notebook closed"
      : closedBack
        ? "Notebook closed — the back cover. Reopen it to read the dedication"
        : dedicationRight
          ? "Inside the back cover — a dedication"
          : `Page ${page.n} of ${TOTAL}: ${page.title}`;

  return (
    <div
      className="pn-root flex w-full flex-col items-center gap-5"
      data-nb-state={state.status}
      data-nb-page={closed ? "cover" : closedBack ? "back-cover" : dedicationRight ? "dedication" : String(page.n)}
      data-nb-busy={busy ? "true" : "false"}
      data-nb-ready={ready ? "true" : "false"}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Interactive pocket notebook. Use left and right arrow keys to turn pages."
    >
      <div
        className="pn-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="group"
        aria-label="Pocket notebook"
      >
        <div className="pn-spread">
        {/* left leaf — the verso half of the spread (out of frame on mobile) */}
        {showSpread && (
          <div
            className={`pn-leaf-left${state.turn?.kind === "open" || openingBack ? " is-revealing" : ""}${closing || closingBack ? " pn-close-hold" : ""}`}
            aria-hidden="true"
          >
            <div className="pn-rest absolute inset-0">
              <div className="pn-mirror absolute inset-0">
                <CoverInside />
              </div>
              {leftPage && (
                <div className="pn-block absolute inset-[1.6%_2.2%_2%_2.2%]">
                  <div className="pn-mirror absolute inset-0">
                    <PageStack
                      count={Math.max(2, Math.round((9 * (leftIndex + 1)) / TOTAL))}
                      depth={(leftIndex + 1) / TOTAL}
                    />
                  </div>
                  <div className="absolute inset-0 z-20">
                    <div className="pn-mirror absolute inset-0">
                      <Sheet wear={sheetWear(leftPage.n, TOTAL)}>
                        <div className="pn-mirror absolute inset-0">
                          <PageContent page={leftPage} total={TOTAL} />
                        </div>
                      </Sheet>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* closed-back board rests on the LEFT half — the mirror image of the
            closed front cover. During the closing swing it is revealed only
            once the leaf passes 90°; while reopening it is held under the
            leaf for the first half so no frame reads as a missing board. */}
        {(closedBack || openingBack) && (
          <div
            className={`pn-leaf-left${closingBack ? " pn-cover-reveal" : ""}${openingBack ? " pn-cover-hold" : ""}`}
            aria-hidden="true"
          >
            <div className="pn-rest absolute inset-0">
              <BackCoverOutside />
            </div>
          </div>
        )}
        <div className="pn-book" data-testid="pn-book">
          {/* resting layer — always correct before any animation ends */}
          {closed && (
            <div
              className={`pn-rest absolute inset-0 z-10${closing ? " pn-cover-reveal" : ""}`}
              data-rest="cover"
            >
              <CoverFront
                interactive={ready && state.status === "closed-front"}
                hintVisible={ready && closed}
              />
            </div>
          )}
          {showSpread && (
            <div
              className={`pn-rest absolute inset-0 z-10${closing || closingBack ? " pn-close-hold" : ""}${openingBack ? " pn-cover-reveal" : ""}`}
              data-rest={dedicationRight ? "dedication" : `page-${restPage.n}`}
            >
              {dedicationRight ? (
                /* the pastedown is the board itself: full-bleed, no paper stack */
                <BackCoverInside />
              ) : (
                <>
              <div aria-hidden="true" className="absolute inset-0">
                <CoverInside />
              </div>
              <div className="pn-block absolute inset-[1.6%_2.2%_2%_2.2%]">
                <PageStack
                  count={Math.max(2, Math.round((9 * (TOTAL - restIndex)) / TOTAL))}
                  depth={(TOTAL - restIndex) / TOTAL}
                />
                <div className="absolute inset-0 z-20">
                  <Sheet wear={sheetWear(restPage.n, TOTAL)}>
                    <PageContent page={restPage} total={TOTAL} />
                  </Sheet>

                </div>
              </div>
                </>
              )}
              {/* fore-edge affordance: hovering the page's outer edge lifts it
                  slightly, hinting it can be grabbed; clicking turns the page */}
              {ready && !busy && canNext && state.status === "open" && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="pn-grab absolute inset-y-0 right-0 z-30 w-[9%]"
                  onClick={next}
                  aria-hidden="true"
                />
              )}
            </div>
          )}


          {/* the closed cover is held under the flying leaf for the first half of
              the opening turn, so the few frames the leaf needs before it starts
              moving never read as a missing cover */}
          {state.turn?.kind === "open" && (
            <div className="pn-rest pn-cover-hold absolute inset-0 z-30" aria-hidden="true">
              <CoverFront hintVisible={false} />
            </div>
          )}

          {state.turn && (
            <TurningSheet key={state.turn.key} turn={state.turn} reduced={reduced} onDone={settle} />
          )}

          {ready && state.status === "closed-front" && (
            <button
              type="button"
              className="pn-hit absolute inset-0 z-50 rounded-[6px]"
              onClick={open}
              aria-label="Open the notebook"
            >
              <span className="sr-only">Open the notebook</span>
            </button>
          )}
          {ready && state.status === "closed-back" && (
            <button
              type="button"
              className="pn-hit absolute inset-0 z-50 rounded-[6px]"
              onClick={prev}
              aria-label="Open the back cover to the dedication"
            >
              <span className="sr-only">Open the back cover</span>
            </button>
          )}
        </div>
        </div>
      </div>

      <p aria-live="polite" className="pn-status" data-testid="pn-status">
        {status}
      </p>

      <div className="flex w-full max-w-[420px] items-center justify-center gap-3 px-4">
        <button
          type="button"
          onClick={prev}
          disabled={!ready || !canPrev || busy}
          data-testid="pn-prev"
          className="pn-btn"
          aria-label={
            state.status === "closed-back"
              ? "Open the back cover to the dedication"
              : state.status === "open" && state.page === 0
                ? "Close the notebook"
                : "Previous page"
          }
        >
          {state.status === "closed-back" ? "Open" : state.status === "open" && state.page === 0 ? "Close" : "Previous"}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!ready || !canNext || busy}
          data-testid="pn-next"
          className="pn-btn pn-btn-primary"
          aria-label={
            closed ? "Open the notebook" : atEnd ? "The end of the notebook" : "Next page"
          }
        >
          {closed ? "Open" : atEnd ? "The end" : "Next"}
        </button>
      </div>
    </div>
  );
}
