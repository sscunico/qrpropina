"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type Props = {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
};

function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function InfoTooltip({ text, position = "top" }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const mobile = window.innerWidth <= 720;
      setIsMobile(mobile);

      if (mobile) {
        setStyle({ left: 16, right: 16, top: 86 });
        return;
      }

      if (position === "bottom") {
        setStyle({ left: rect.left + rect.width / 2, top: rect.bottom + 8 });
      } else if (position === "right") {
        setStyle({ left: rect.right + 8, top: rect.top + rect.height / 2 });
      } else if (position === "left") {
        setStyle({ left: rect.left - 8, top: rect.top + rect.height / 2 });
      } else {
        setStyle({ left: rect.left + rect.width / 2, top: rect.top - 8 });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const tooltip = mounted && open
    ? createPortal(
        <span
          className={[
            "info-tooltip__content",
            `info-tooltip__content--${position}`,
            isMobile ? "info-tooltip__content--mobile" : null
          ].filter(Boolean).join(" ")}
          id={id}
          ref={contentRef}
          role="tooltip"
          style={style}
        >
          {text}
        </span>,
        document.body
      )
    : null;

  return (
    <span className={`info-tooltip info-tooltip--${position}`} aria-label={text}>
      <button
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-label={text}
        className="info-tooltip__trigger"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onMouseEnter={() => {
          if (canHover()) setOpen(true);
        }}
        onMouseLeave={() => {
          if (canHover()) setOpen(false);
        }}
        ref={triggerRef}
        type="button"
      >
        <Info size={14} />
      </button>
      {tooltip}
    </span>
  );
}
