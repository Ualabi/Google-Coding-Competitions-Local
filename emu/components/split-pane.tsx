"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

const MIN_PANE_PERCENT = 25;

export function SplitPane({
  left,
  right,
  initialLeftPercent = 45,
}: {
  left: ReactNode;
  right: ReactNode;
  initialLeftPercent?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(initialLeftPercent);
  const draggingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(
      Math.min(
        100 - MIN_PANE_PERCENT,
        Math.max(MIN_PANE_PERCENT, percent),
      ),
    );
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    abortRef.current?.abort();
  }, []);

  const startDragging = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const controller = new AbortController();
    abortRef.current = controller;
    window.addEventListener("pointermove", handlePointerMove, {
      signal: controller.signal,
    });
    window.addEventListener("pointerup", stopDragging, {
      signal: controller.signal,
    });
  }, [handlePointerMove, stopDragging]);

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1">
      <div style={{ width: `${leftWidth}%` }} className="min-w-0">
        {left}
      </div>
      <button
        type="button"
        aria-label="Resize panels"
        onPointerDown={startDragging}
        className="group relative w-1.5 shrink-0 cursor-col-resize bg-chrome-border/50 transition-colors hover:bg-blue-500/70 active:bg-blue-500"
      >
        <span className="absolute top-1/2 left-1/2 flex h-8 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-chrome-border text-[10px] text-white group-hover:bg-blue-500">
          ⋮
        </span>
      </button>
      <div style={{ width: `${100 - leftWidth}%` }} className="min-w-0">
        {right}
      </div>
    </div>
  );
}
