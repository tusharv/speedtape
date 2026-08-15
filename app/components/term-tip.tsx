"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { termText, type TermKey } from "@/lib/terms";

const PAD = 8;

function placeTooltip(trigger: DOMRect, bubble: DOMRect): CSSProperties {
  const maxWidth = Math.min(264, window.innerWidth - PAD * 2);
  const width = bubble.width > 0 ? Math.min(bubble.width, maxWidth) : maxWidth;
  const height = bubble.height > 0 ? bubble.height : 72;
  let left = trigger.left + trigger.width / 2 - width / 2;
  left = Math.min(Math.max(PAD, left), window.innerWidth - width - PAD);
  const gap = 8;
  const above = trigger.top - height - gap;
  const below = trigger.bottom + gap;
  const top =
    above >= PAD
      ? above
      : Math.min(below, window.innerHeight - height - PAD);

  return {
    position: "fixed",
    top: `${Math.max(PAD, top)}px`,
    left: `${left}px`,
    maxWidth: `${maxWidth}px`,
    zIndex: 80,
  };
}

export function TermTip({
  term,
  children,
  className = "",
}: {
  term: TermKey;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed" });

  useEffect(() => {
    setMounted(true);
  }, []);

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current?.getBoundingClientRect();
    if (!trigger) return;
    setStyle(
      placeTooltip(
        trigger,
        bubble ?? new DOMRect(0, 0, 264, 72),
      ),
    );
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    place();
    const onReposition = () => place();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, { capture: true, passive: true });
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [mounted, open, place]);

  function show() {
    setOpen(true);
    place();
  }

  function hide() {
    setOpen(false);
  }

  const bubble = (
    <span
      ref={bubbleRef}
      id={id}
      className="term-tip-bubble"
      role="tooltip"
      data-open={open ? "true" : "false"}
      data-portal={mounted ? "true" : "false"}
      style={mounted ? style : undefined}
    >
      {termText(term)}
    </span>
  );

  return (
    <>
      <abbr
        ref={triggerRef}
        className={`term-tip ${className}`.trim()}
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
        {mounted ? null : bubble}
      </abbr>
      {mounted ? createPortal(bubble, document.body) : null}
    </>
  );
}
