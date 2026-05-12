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
  const m = cssColor.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${opacity})`;
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
      el.setAttribute("style", "position:absolute;left:-9999px;pointer-events:none");
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

  const rgba = fromHex ?? fromVar ?? glareColor;

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
      {children}
    </div>
  );
};

export default GlareHover;
