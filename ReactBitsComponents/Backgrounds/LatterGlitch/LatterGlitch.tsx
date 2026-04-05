import { useRef, useEffect, useCallback } from "react";

interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
}

const LetterGlitch = ({
  glitchColors = ["#2b4539", "#61dca3", "#61b3dc"],
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
}: LetterGlitchProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<any[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());

  // These are our "Base" sizes in physical pixels
  const baseFontSize = 16;
  const baseCharWidth = 10;
  const baseCharHeight = 20;

  const lettersAndSymbols = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","!","@","#","$","&","*","(",")","-","_", "+","=","/", "[","]","{","}",";",":","<",">",",","0","1","2","3","4","5","6","7","8","9"];

  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex: string) => {
    if (hex.startsWith('rgb')) {
      const parts = hex.match(/\d+/g);
      return parts ? { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) } : null;
    }
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const interpolateColor = (start: any, end: any, factor: number) => {
    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      context.current = ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Adjust grid calculation to account for DPR 
    // This keeps the letter count the same regardless of zoom
    const columns = Math.ceil(rect.width / (baseCharWidth / dpr));
    const rows = Math.ceil(rect.height / (baseCharHeight / dpr));

    if (grid.current.columns !== columns || grid.current.rows !== rows) {
      grid.current = { columns, rows };
      const totalLetters = columns * rows;
      letters.current = Array.from({ length: totalLetters }, () => ({
        char: getRandomChar(),
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 1,
      }));
    }
  }, []);

  const drawLetters = () => {
    const ctx = context.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Normalize our measurements by the current zoom (DPR)
    const fontSize = baseFontSize / dpr;
    const charWidth = baseCharWidth / dpr;
    const charHeight = baseCharHeight / dpr;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    for (let i = 0; i < letters.current.length; i++) {
      const letter = letters.current[i];
      if (!letter) continue;
      const x = (i % grid.current.columns) * charWidth;
      const y = Math.floor(i / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    for (const letter of letters.current) {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        const startRgb = hexToRgb(letter.color); 
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, Math.min(letter.colorProgress, 1));
          needsRedraw = true;
        }
      }
    }
    return needsRedraw;
  };

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      let shouldDraw = false;

      if (now - lastGlitchTime.current >= glitchSpeed) {
        const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));
        for (let i = 0; i < updateCount; i++) {
          const index = Math.floor(Math.random() * letters.current.length);
          const letter = letters.current[index];
          if (letter) {
            letter.char = getRandomChar();
            letter.targetColor = getRandomColor();
            letter.colorProgress = smooth ? 0 : 1;
            if (!smooth) letter.color = letter.targetColor;
          }
        }
        shouldDraw = true;
        lastGlitchTime.current = now;
      }

      if (smooth && handleSmoothTransitions()) {
        shouldDraw = true;
      }

      if (shouldDraw) drawLetters();
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);

    window.addEventListener("resize", resizeCanvas);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [glitchSpeed, smooth, resizeCanvas]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#000", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {outerVignette && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)" }} />}
      {centerVignette && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)" }} />}
    </div>
  );
};

export default LetterGlitch;
