import React, { useEffect, useState } from "react";
import "./GlareHover.css";

interface GlareHoverProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function buildRgbaFromHex(glareColor: string, glareOpacity: number): string | null {
  const hex = glareColor.replace("#", "");
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }
  return null;
}

function rgbCssToRgba(cssColor: string, opacity: number): string | null {
  const trimmed = (cssColor || "").trim();
  const legacy = trimmed.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (legacy) {
    return `rgba(${legacy[1]}, ${legacy[2]}, ${legacy[3]}, ${opacity})`;
  }
  const space = trimmed.match(/^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+\s*)?\)/i);
  if (space) {
    return `rgba(${space[1]}, ${space[2]}, ${space[3]}, ${opacity})`;
  }
  return null;
}

const GlareHover: React.FC<GlareHoverProps> = ({
  width = "500px",
  height = "500px",
  background = "#000",
  borderRadius = "10px",
  borderColor = "#333",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = "",
  style = {},
}) => {
  const fromHex = buildRgbaFromHex(glareColor, glareOpacity);
  const [fromVar, setFromVar] = useState<string | null>(null);

  useEffect(() => {
    if (fromHex !== null) {
      setFromVar(null);
      return;
    }
    if (typeof document === "undefined") return;

    const measureOn = (host: HTMLElement) => {
      const el = document.createElement("span");
      el.setAttribute("style", "position:absolute;left:-9999px;pointer-events:none;visibility:hidden");
      el.style.color = glareColor;
      host.appendChild(el);
      const c = getComputedStyle(el).color;
      host.removeChild(el);
      return rgbCssToRgba(c, glareOpacity);
    };

    const resolved =
      measureOn(document.body) ||
      measureOn(document.documentElement);
    setFromVar(resolved);
  }, [fromHex, glareColor, glareOpacity]);

  // On very light themes, a bare accent or white reads as "nothing moves". Bias var()-based
  // colors slightly toward a dark neutral so the gradient peak stays visible on white cards.
  const rawRgba = fromHex ?? fromVar ?? glareColor;
  const rgba =
    fromHex !== null || fromVar !== null
      ? rawRgba
      : /\bvar\s*\(/i.test(String(glareColor).trim())
        ? `color-mix(in srgb, ${glareColor} 65%, #0f172a 35%)`
        : rawRgba;

  const vars: React.CSSProperties & { [k: string]: string } = {
    "--gh-width": width,
    "--gh-height": height,
    "--gh-bg": background,
    "--gh-br": borderRadius,
    "--gh-angle": `${glareAngle}deg`,
    "--gh-duration": `${transitionDuration}ms`,
    "--gh-size": `${glareSize}%`,
    "--gh-rgba": rgba,
    "--gh-border": borderColor,
  };

  return (
    <div
      className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${className}`}
      style={{ ...vars, ...style } as React.CSSProperties}
    >
      <div className="glare-hover__inner">{children}</div>
    </div>
  );
};

export default GlareHover;
