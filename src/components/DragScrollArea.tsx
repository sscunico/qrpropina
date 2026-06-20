"use client";

import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type DragScrollAreaProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function DragScrollArea({ ariaLabel, children, className }: DragScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-no-drag-scroll]")) return;

    const element = ref.current;
    if (!element || element.scrollWidth <= element.clientWidth) return;

    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: element.scrollLeft
    };
    element.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || !drag.current.active) return;

    const deltaX = event.clientX - drag.current.startX;
    if (Math.abs(deltaX) > 4) {
      drag.current.moved = true;
    }

    element.scrollLeft = drag.current.scrollLeft - deltaX;
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || !drag.current.active) return;

    drag.current.active = false;
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!drag.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  }

  return (
    <div
      aria-label={ariaLabel}
      className={[className, isDragging ? "dragging" : null].filter(Boolean).join(" ")}
      onClickCapture={handleClickCapture}
      onPointerCancel={stopDragging}
      onPointerDown={handlePointerDown}
      onPointerLeave={stopDragging}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      ref={ref}
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
