"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";

const PAD = 0;
const PAD_LINK = 2;
const PAD_NAV_LINK = 3;
const PAD_CONTENT_LINK = 10;
const HIT_PADDING = 12;
const GAP_PAD = 6;
const PILL_RADIUS = 8;
const MOVE_DURATION_MS = 120;
const EXIT_DURATION_MS = 200;
const EXIT_EASE = (t: number) => 1 - (1 - t) ** 2;

function getPad(el: HTMLElement): number {
  if (el.classList.contains("nav-link")) return PAD_NAV_LINK;
  if (el.classList.contains("content-link")) return PAD_CONTENT_LINK;
  if (el.classList.contains("detail-overlay-close")) return PAD_CONTENT_LINK;
  return el.tagName === "A" ? PAD_LINK : HIT_PADDING;
}

/** Padding for the hover pill (list row buttons stay tight at 0). */
function getHoverPad(el: HTMLElement): number {
  if (el.classList.contains("nav-link")) return PAD_NAV_LINK;
  if (el.classList.contains("content-link")) return PAD_CONTENT_LINK;
  if (el.classList.contains("detail-overlay-close")) return PAD_CONTENT_LINK;
  return el.tagName === "A" ? PAD_LINK : PAD;
}

/** Avoid 0/0 → NaN and huge ratios → Infinity when multiplying by box size later. */
function normAlongAxis(value: number, start: number, size: number, fallbackPct: number): number {
  if (size > 0 && Number.isFinite(size)) {
    const t = ((value - start) / size) * 100;
    if (!Number.isFinite(t)) return fallbackPct;
    return Math.min(100, Math.max(0, t));
  }
  return fallbackPct;
}

function normAlongAxis01(value: number, start: number, size: number): number {
  if (size > 0 && Number.isFinite(size)) {
    const t = (value - start) / size;
    if (!Number.isFinite(t)) return 0.5;
    return Math.min(1, Math.max(0, t));
  }
  return 0.5;
}

/** React rejects NaN/Infinity on pixel style props; keep values finite. */
function cssPx(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/**
 * Mobile detail sheet: `elementFromPoint` alone is unreliable (SVG layers, stacking).
 * Walk the hit-test stack so the X and CTA resolve to their button/link consistently.
 */
function tryDetailOverlayClickableAtPoint(
  x: number,
  y: number
): { done: true; result: { element: HTMLElement | null; fromFallback: boolean } } | { done: false } {
  const overlay = document.querySelector("[data-detail-overlay]");
  if (!overlay) return { done: false };

  const stack = document.elementsFromPoint(x, y);
  let hitOverlay = false;

  for (const node of stack) {
    if (!(node instanceof Element)) continue;
    if (!overlay.contains(node)) continue;
    hitOverlay = true;

    const clickable = node.closest<HTMLElement>("a, button, [role='button']");
    if (!clickable || !overlay.contains(clickable)) continue;

    const pad = getPad(clickable);
    const r = clickable.getBoundingClientRect();
    const left = r.left - pad;
    const top = r.top - pad;
    const width = r.width + pad * 2;
    const height = r.height + pad * 2;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      return { done: true, result: { element: clickable, fromFallback: false } };
    }
  }

  if (hitOverlay) {
    return { done: true, result: { element: null, fromFallback: false } };
  }
  return { done: false };
}

function getClickableAtPoint(
  x: number,
  y: number,
  lastHovered: HTMLElement | null
): { element: HTMLElement | null; fromFallback: boolean } {
  const overlayPick = tryDetailOverlayClickableAtPoint(x, y);
  if (overlayPick.done) {
    return overlayPick.result;
  }

  const topmost = document.elementFromPoint(x, y);
  if (lastHovered && topmost && lastHovered.contains(topmost)) {
    const r = lastHovered.getBoundingClientRect();
    const pad = getPad(lastHovered);
    const expand = Math.max(pad, GAP_PAD);
    const left = r.left - expand;
    const top = r.top - expand;
    const width = r.width + expand * 2;
    const height = r.height + expand * 2;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      const inPrimary =
        x >= r.left - pad && x <= r.left + r.width + pad &&
        y >= r.top - pad && y <= r.top + r.height + pad;
      return { element: lastHovered, fromFallback: !inPrimary };
    }
  }
  if (topmost) {
    const clickable = topmost.closest<HTMLElement>("a, button, [role='button']");
    if (clickable) {
      const pad = getPad(clickable);
      const r = clickable.getBoundingClientRect();
      const left = r.left - pad;
      const top = r.top - pad;
      const width = r.width + pad * 2;
      const height = r.height + pad * 2;
      if (x >= left && x <= left + width && y >= top && y <= top + height) {
        return { element: clickable, fromFallback: false };
      }
    }
  }
  const navLinks = document.querySelectorAll<HTMLElement>(".nav-link");
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const el of navLinks) {
    const r = el.getBoundingClientRect();
    const left = r.left - PAD_NAV_LINK;
    const top = r.top - PAD_NAV_LINK;
    const width = r.width + PAD_NAV_LINK * 2;
    const height = r.height + PAD_NAV_LINK * 2;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = (x - cx) ** 2 + (y - cy) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
  }
  if (best) return { element: best, fromFallback: true };

  const allClickables = document.querySelectorAll<HTMLElement>("a, button, [role='button']");
  for (const el of allClickables) {
    const r = el.getBoundingClientRect();
    const pad = el.classList.contains("nav-link")
      ? PAD_NAV_LINK
      : el.classList.contains("content-link")
        ? PAD_CONTENT_LINK
        : el.tagName === "A"
          ? PAD_LINK
          : PAD;
    const expand = Math.max(pad, GAP_PAD);
    const left = r.left - expand;
    const top = r.top - expand;
    const width = r.width + expand * 2;
    const height = r.height + expand * 2;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = (x - cx) ** 2 + (y - cy) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
  }
  return { element: best, fromFallback: best !== null };
}

function useIsPointerDevice() {
  const [isPointer, setIsPointer] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setIsPointer(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return isPointer;
}

export function CustomCursor() {
  const isPointerDevice = useIsPointerDevice();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  const [dark, setDark] = useState(false);
  const [hoverBox, setHoverBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [morphStart, setMorphStart] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [pillExpanded, setPillExpanded] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [isExiting, setIsExiting] = useState(false);
  const [exitBox, setExitBox] = useState<{
    width: number;
    height: number;
    borderRadius: number;
  } | null>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const hoveredFromFallbackRef = useRef(false);
  const isExitingRef = useRef(false);
  const hoverBoxRef = useRef<typeof hoverBox>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const exitOriginRef = useRef({ fx: 0.5, fy: 0.5 });
  const exitStartRef = useRef<{ width: number; height: number; startTime: number } | null>(null);
  const exitFinalCenterRef = useRef<{ x: number; y: number } | null>(null);
  const posHoldUntilRef = useRef(0);
  const rafScheduledRef = useRef(false);
  /** After interacting with overlay controls, block re-hovering them until the pointer moves. */
  const detailOverlayHoverSuppressRef = useRef<{ x: number; y: number } | null>(null);
  const [circleSmoothExit, setCircleSmoothExit] = useState(false);
  const [circleScale, setCircleScale] = useState(1);

  const resetHover = useCallback(() => {
    hoveredRef.current = null;
    hoveredFromFallbackRef.current = false;
    isExitingRef.current = false;
    exitStartRef.current = null;
    exitFinalCenterRef.current = null;
    posHoldUntilRef.current = 0;
    rafScheduledRef.current = false;
    hoverBoxRef.current = null;
    setCircleSmoothExit(false);
    setExitBox(null);
    setHoverBox(null);
    setMorphStart(null);
    setPillExpanded(false);
    setIsExiting(false);
  }, []);

  const clearDetailOverlaySuppress = useCallback(() => {
    detailOverlayHoverSuppressRef.current = null;
  }, []);

  posRef.current = pos;
  hoverBoxRef.current = hoverBox;
  if (isExiting && exitBox) {
    const { fx, fy } = exitOriginRef.current;
    const cx = pos.x - fx * exitBox.width + exitBox.width / 2;
    const cy = pos.y - fy * exitBox.height + exitBox.height / 2;
    exitFinalCenterRef.current = { x: Math.round(cx), y: Math.round(cy) };
  }

  const updateAt = useCallback((x: number, y: number) => {
    // If the previously-hovered element got unmounted (e.g. closing the mobile overlay),
    // clear hover state so we don't animate from a stale rect and "fly off".
    if (hoveredRef.current && !hoveredRef.current.isConnected) {
      resetHover();
    }

    // After reset on overlay link/button, the next updateAt still sees the CTA under the cursor
    // and would re-expand the pill unless we ignore that until the pointer moves.
    const sup = detailOverlayHoverSuppressRef.current;
    if (sup) {
      const dx = x - sup.x;
      const dy = y - sup.y;
      if (dx * dx + dy * dy >= 64) {
        detailOverlayHoverSuppressRef.current = null;
      } else {
        const probe = getClickableAtPoint(x, y, hoveredRef.current);
        const el = probe.element;
        if (el && el.closest("[data-detail-overlay]")) {
          return;
        }
      }
    }

    const { element: clickable, fromFallback } = getClickableAtPoint(x, y, hoveredRef.current);
    if (clickable) {
      hoveredFromFallbackRef.current = fromFallback;
      isExitingRef.current = false;
      setIsExiting(false);
      const r = clickable.getBoundingClientRect();
      const pad = getHoverPad(clickable);
      const box = {
        left: r.left - pad,
        top: r.top - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      };
      const wasOverSomething = hoveredRef.current !== null;
      const isNew = hoveredRef.current !== clickable;
      if (isNew) {
        hoveredRef.current = clickable;
        const px = normAlongAxis(x, box.left, box.width, 50);
        const py = normAlongAxis(y, box.top, box.height, 50);
        setOrigin({ x: px, y: py });
        if (!wasOverSomething) {
          setMorphStart({
            left: x - 10,
            top: y - 10,
            width: 20,
            height: 20,
          });
          setPillExpanded(false);
        } else {
          setPillExpanded(true);
          setMorphStart(null);
        }
        setHoverBox(box);
      } else {
        const prev = hoverBoxRef.current;
        if (!prev || prev.left !== box.left || prev.top !== box.top || prev.width !== box.width || prev.height !== box.height) {
          setHoverBox(box);
        }
      }
    } else {
      hoveredRef.current = null;
      hoveredFromFallbackRef.current = false;
      if (hoverBoxRef.current !== null && !isExitingRef.current) {
        const box = hoverBoxRef.current;
        isExitingRef.current = true;
        exitOriginRef.current = {
          fx: normAlongAxis01(x, box.left, box.width),
          fy: normAlongAxis01(y, box.top, box.height),
        };
        exitStartRef.current = {
          width: box.width,
          height: box.height,
          startTime: performance.now(),
        };
        setExitBox({
          width: box.width,
          height: box.height,
          borderRadius: PILL_RADIUS,
        });
        setIsExiting(true);
      }
    }
  }, [resetHover]);

  const updateCursor = useCallback(
    (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      posRef.current = { x, y };
      setVisible(true);
      updateAt(x, y);
      if (rafScheduledRef.current) return;
      rafScheduledRef.current = true;
      requestAnimationFrame(() => {
        rafScheduledRef.current = false;
        const { x: px, y: py } = posRef.current;
        if (performance.now() >= posHoldUntilRef.current) {
          setPos({ x: px, y: py });
        }
      });
    },
    [updateAt]
  );

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(m.matches);
    const onDark = (e: MediaQueryListEvent) => setDark(e.matches);
    m.addEventListener("change", onDark);
    return () => m.removeEventListener("change", onDark);
  }, []);

  useEffect(() => {
    if (hoverBox && !pillExpanded && morphStart) {
      const id = requestAnimationFrame(() => setPillExpanded(true));
      return () => cancelAnimationFrame(id);
    }
  }, [hoverBox, pillExpanded, morphStart]);

  const handleExitEnd = useCallback(() => {
    if (!isExitingRef.current) return;
    const center = exitFinalCenterRef.current;
    if (center) {
      setPos(center);
      exitFinalCenterRef.current = null;
    }
    posHoldUntilRef.current = performance.now() + 32;
    setCircleScale(0.82);
    setCircleSmoothExit(true);
    isExitingRef.current = false;
    exitStartRef.current = null;
    setExitBox(null);
    setHoverBox(null);
    setMorphStart(null);
    setIsExiting(false);
  }, []);

  useEffect(() => {
    if (!circleSmoothExit) return;
    const rafId = requestAnimationFrame(() => setCircleScale(1));
    const id = window.setTimeout(() => {
      setCircleSmoothExit(false);
      setCircleScale(1);
    }, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(id);
    };
  }, [circleSmoothExit]);

  useEffect(() => {
    if (!isExiting || !exitStartRef.current) return;
    const start = exitStartRef.current;
    let rafId: number;
    const tick = () => {
      const elapsed = performance.now() - start.startTime;
      const t = Math.min(1, elapsed / EXIT_DURATION_MS);
      const eased = EXIT_EASE(t);
      setExitBox({
        width: start.width + (20 - start.width) * eased,
        height: start.height + (20 - start.height) * eased,
        borderRadius: PILL_RADIUS + (50 - PILL_RADIUS) * eased,
      });
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = requestAnimationFrame(handleExitEnd);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isExiting, handleExitEnd]);

  useEffect(() => {
    const onLeave = () => {
      detailOverlayHoverSuppressRef.current = null;
      setVisible(false);
      isExitingRef.current = false;
      exitStartRef.current = null;
      posHoldUntilRef.current = 0;
      hoveredRef.current = null;
      hoveredFromFallbackRef.current = false;
      setCircleSmoothExit(false);
      setExitBox(null);
      setHoverBox(null);
      setMorphStart(null);
      setIsExiting(false);
    };
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", updateCursor, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", updateCursor);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [updateCursor]);

  useEffect(() => {
    const onCaptureClick = (e: MouseEvent) => {
      const targetEl = e.target instanceof Element ? e.target : null;
      // Never hijack clicks inside the detail overlay (e.g. the close button).
      if (targetEl?.closest("[data-detail-overlay]")) return;
      const hovered = hoveredRef.current;
      if (!hovered || !hoveredFromFallbackRef.current) return;
      const target = e.target as Node;
      if (hovered === target || hovered.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();
      hovered.click();
    };
    document.documentElement.addEventListener("click", onCaptureClick, true);
    return () => document.documentElement.removeEventListener("click", onCaptureClick, true);
  }, []);

  useEffect(() => {
    const onOverlayPointerDown = (e: PointerEvent | MouseEvent) => {
      const targetEl = e.target instanceof Element ? e.target : null;
      const overlay = targetEl?.closest("[data-detail-overlay]");
      if (!overlay) return;

      const clicked = targetEl?.closest<HTMLElement>("a, button, [role='button']");
      if (!clicked || !overlay.contains(clicked)) return;

      // Commit hover reset synchronously, then suppress re-hovering the same
      // overlay control until the pointer moves (otherwise the next updateAt
      // immediately re-selects the link under the cursor).
      flushSync(() => {
        resetHover();
      });
      detailOverlayHoverSuppressRef.current = { x: e.clientX, y: e.clientY };
    };

    document.documentElement.addEventListener("pointerdown", onOverlayPointerDown as EventListener, true);
    return () => {
      document.documentElement.removeEventListener("pointerdown", onOverlayPointerDown as EventListener, true);
    };
  }, [resetHover]);

  useEffect(() => {
    const onResetOnPress = (e: PointerEvent) => {
      // Only when “mobile” layout (< md): desktop should keep the pill on the selected row.
      if (window.matchMedia("(min-width: 768px)").matches) return;
      const targetEl = e.target instanceof Element ? e.target : null;
      if (!targetEl) return;
      if (targetEl.closest("[data-detail-overlay]")) return;
      const trigger = targetEl.closest(".cursor-reset-on-press");
      if (!trigger) return;

      flushSync(() => {
        resetHover();
      });
      detailOverlayHoverSuppressRef.current = { x: e.clientX, y: e.clientY };
    };

    document.documentElement.addEventListener("pointerdown", onResetOnPress as EventListener, true);
    return () => {
      document.documentElement.removeEventListener("pointerdown", onResetOnPress as EventListener, true);
    };
  }, [resetHover]);

  useEffect(() => {
    const onReset = () => {
      clearDetailOverlaySuppress();
      resetHover();
    };
    window.addEventListener("customcursor:reset", onReset as EventListener);
    return () => window.removeEventListener("customcursor:reset", onReset as EventListener);
  }, [resetHover, clearDetailOverlaySuppress]);

  useEffect(() => {
    const sync = () => {
      const { x, y } = posRef.current;
      updateAt(x, y);
    };
    document.addEventListener("scroll", sync, { passive: true, capture: true });
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("scroll", sync, { capture: true });
      window.removeEventListener("resize", sync);
    };
  }, [updateAt]);

  useEffect(() => {
    if (!hoverBox || isExitingRef.current) return;
    const el = hoveredRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (isExitingRef.current || hoveredRef.current !== el) return;
      const r = el.getBoundingClientRect();
      const pad = getHoverPad(el);
      setHoverBox({
        left: r.left - pad,
        top: r.top - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hoverBox, isExiting]);

  if (!isPointerDevice || !visible) return null;

  const showCircle = !hoverBox && !isExiting;

  return (
    <>
      {showCircle && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[2147483647] will-change-transform"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${circleScale})`,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
            transition: circleSmoothExit
              ? "transform 0.15s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease-out"
              : "opacity 0.2s ease-out",
          }}
          aria-hidden
        />
      )}

      {(hoverBox || isExiting) && (pillExpanded || morphStart || isExiting) && (!isExiting || exitBox) && (
        <div
          className="pointer-events-none fixed z-[2147483646]"
          style={{
            left: cssPx(
              isExiting
                ? pos.x - exitOriginRef.current.fx * exitBox!.width
                : pillExpanded
                  ? hoverBox!.left
                  : morphStart!.left
            ),
            top: cssPx(
              isExiting
                ? pos.y - exitOriginRef.current.fy * exitBox!.height
                : pillExpanded
                  ? hoverBox!.top
                  : morphStart!.top
            ),
            width: cssPx(isExiting ? exitBox!.width : pillExpanded ? hoverBox!.width : morphStart!.width),
            height: cssPx(isExiting ? exitBox!.height : pillExpanded ? hoverBox!.height : morphStart!.height),
            borderRadius: isExiting ? exitBox!.borderRadius : pillExpanded ? PILL_RADIUS : 50,
            background: dark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: isExiting
              ? "none"
              : `left ${MOVE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1), top ${MOVE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1), width ${MOVE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1), height ${MOVE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1), border-radius ${MOVE_DURATION_MS}ms cubic-bezier(0.2, 0, 0, 1)`,
          }}
          aria-hidden
        />
      )}
    </>
  );
}
