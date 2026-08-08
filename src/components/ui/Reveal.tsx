"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  as?: ElementType;
  /** Cascade the direct children instead of moving the block as one unit. */
  stagger?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

/**
 * Scroll reveal, per AGENTS.md rule 11.
 *
 * The hidden state lives behind `[data-armed]` in globals.css, and that
 * attribute is only ever set here, after mount. So the server ships visible
 * HTML and stays visible for anyone without JS, without IntersectionObserver,
 * or with reduced motion requested — there is no path to invisible content and
 * no flash of hidden text.
 */
export default function Reveal({
  as: Component = "div",
  stagger = false,
  className,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (
      !node ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Already on screen at mount: never arm at all. Fading in content the
    // reader is looking at before they have scrolled is worse than no motion.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setArmed(true);

    const reveal = () => {
      setShown(true);
      observer.disconnect();
      window.removeEventListener("scroll", flushAtBottom);
      window.removeEventListener("resize", flushAtBottom);
    };

    // One-shot. Re-animating on every pass is nauseating. The negative bottom
    // margin fires the transition slightly before the block reaches the fold,
    // so the motion finishes as it settles rather than starting once it is
    // already sitting there.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    // Safety net for short viewports: an element that sits entirely inside the
    // -12% dead zone at full scroll can never intersect. Once the document
    // bottom is reached there is no more scrolling to wait for.
    function flushAtBottom() {
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY < doc.scrollHeight - 2) return;
      reveal();
    }

    observer.observe(node);
    window.addEventListener("scroll", flushAtBottom, { passive: true });
    window.addEventListener("resize", flushAtBottom, { passive: true });
    flushAtBottom();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", flushAtBottom);
      window.removeEventListener("resize", flushAtBottom);
    };
  }, []);

  return (
    <Component
      ref={ref}
      data-armed={armed ? "" : undefined}
      className={cn(stagger ? "reveal--stagger" : "reveal", shown && "is-in", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
