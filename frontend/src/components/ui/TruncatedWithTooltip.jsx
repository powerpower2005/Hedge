import { useEffect, useRef, useState } from "react";

/**
 * Shows native tooltip with full text only when CSS truncation hides overflow.
 * @param {{ as?: React.ElementType, className?: string, title?: string, children: React.ReactNode }} props
 */
export function TruncatedWithTooltip({
  as: Tag = "span",
  className = "",
  title: explicitTitle,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [tooltip, setTooltip] = useState(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const full =
        explicitTitle ??
        (typeof children === "string" ? children : el.textContent?.trim() || "");
      const truncated = el.scrollWidth > el.clientWidth + 1;
      setTooltip(truncated && full ? full : undefined);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, explicitTitle]);

  return (
    <Tag ref={ref} className={className} title={tooltip} {...rest}>
      {children}
    </Tag>
  );
}
