import { useRef, useEffect } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";

type Props = {
  enableRainbow?: boolean;
  gridColor?: string;
  rippleIntensity?: number;
  gridSize?: number;
  gridThickness?: number;
  vignetteStrength?: number; // Added back as a controllable prop
  glowIntensity?: number;
  opacity?: number;
  gridRotation?: number;
  mouseInteraction?: boolean;
  mouseInteractionRadius?: number;
};

const RippleGrid: React.FC<Props> = ({
  enableRainbow = false,
  gridColor = "#ffffff",
  rippleIntensity = 0.05,
  gridSize = 10.0,
  gridThickness = 15.0,
  vignetteStrength = 0.0, // Default to 0 (Full Screen)
  glowIntensity = 0.1,
  opacity = 1.0,
  gridRotation = 0,
  mouseInteraction = true,
  mouseInteractionRadius = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseInfluenceRef = useRef(0);
  const rafIdRef = useRef<number>(0);

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : [1, 1, 1];
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 1.5),
      alpha: true,
      antialias: true
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const vert = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
      }`;

    const frag = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform bool enableRainbow;
      uniform vec3 gridColor;
      uniform float rippleIntensity;
      uniform float gridSize;
      uniform float gridThickness;
      uniform float vignetteStrength;
      uniform float glowIntensity;
      uniform float opacity;
      uniform float gridRotation;
      uniform bool mouseInteraction;
      uniform vec2 mousePosition;
      uniform float mouseInfluence;
      uniform float mouseInteractionRadius;
      varying vec2 vUv;

      mat2 rotate(float angle) {
          float s = sin(angle); float c = cos(angle);
          return mat2(c, -s, s, c);
      }

      void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          uv.x *= iResolution.x / iResolution.y;

          if (gridRotation != 0.0) {
              uv = rotate(gridRotation * 3.14159 / 180.0) * uv;
          }

          float dist = length(uv);
          float func = sin(3.14159 * (iTime - dist));
          vec2 rippleUv = uv + uv * func * rippleIntensity;

          if (mouseInteraction && mouseInfluence > 0.0) {
              vec2 mouseUv = (mousePosition * 2.0 - 1.0);
              mouseUv.x *= iResolution.x / iResolution.y;
              float mDist = length(uv - mouseUv);
              float influence = mouseInfluence * exp(-mDist * mDist / (mouseInteractionRadius * mouseInteractionRadius));
              float mWave = sin(3.14159 * (iTime * 2.0 - mDist * 3.0)) * influence;
              rippleUv += normalize(uv - mouseUv + 0.001) * mWave * rippleIntensity * 0.3;
          }

          vec2 a = sin(gridSize * 0.5 * 3.14159 * rippleUv - 3.14159 / 2.0);
          vec2 b = abs(a);
          float aaWidth = 0.4;
          vec2 smoothB = vec2(smoothstep(0.0, aaWidth, b.x), smoothstep(0.0, aaWidth, b.y));

          vec3 color = vec3(0.0);
          color += exp(-gridThickness * smoothB.x * (0.8 + 0.5 * sin(3.14159 * iTime)));
          color += exp(-gridThickness * smoothB.y);

          if (glowIntensity > 0.0) {
              color += glowIntensity * exp(-gridThickness * 0.3 * smoothB.x);
              color += glowIntensity * exp(-gridThickness * 0.3 * smoothB.y);
          }

          // DYNAMIC VIGNETTE LOGIC
          float vignette = 1.0;
          if (vignetteStrength > 0.0) {
              vignette = 1.0 - pow(length(vUv - 0.5) * 2.0, vignetteStrength);
              vignette = clamp(vignette, 0.0, 1.0);
          }

          vec3 t = enableRainbow ? vec3(vUv.x, vUv.y, 1.0) : gridColor;

          float alpha = length(color) * opacity * vignette;
          gl_FragColor = vec4(color * t * vignette, alpha);
      }`;

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [0, 0] },
        enableRainbow: { value: enableRainbow },
        gridColor: { value: hexToRgb(gridColor) },
        rippleIntensity: { value: rippleIntensity },
        gridSize: { value: gridSize },
        gridThickness: { value: gridThickness },
        vignetteStrength: { value: vignetteStrength },
        glowIntensity: { value: glowIntensity },
        opacity: { value: opacity },
        gridRotation: { value: gridRotation },
        mouseInteraction: { value: mouseInteraction },
        mousePosition: { value: [0.5, 0.5] },
        mouseInfluence: { value: 0 },
        mouseInteractionRadius: { value: mouseInteractionRadius },
      }
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.dpr = Math.min(window.devicePixelRatio, 1.5);
      renderer.setSize(w, h);
      program.uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height
      };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("mousemove", handleMouseMove);
    resize();

    const render = (t: number) => {
      program.uniforms.iTime.value = t * 0.001;

      mousePositionRef.current.x += (targetMouseRef.current.x - mousePositionRef.current.x) * 0.1;
      mousePositionRef.current.y += (targetMouseRef.current.y - mousePositionRef.current.y) * 0.1;
      program.uniforms.mousePosition.value = [mousePositionRef.current.x, mousePositionRef.current.y];

      const targetInfluence = (targetMouseRef.current.x >= 0 && targetMouseRef.current.x <= 1) ? 1.0 : 0.0;
      mouseInfluenceRef.current += (targetInfluence - mouseInfluenceRef.current) * 0.05;
      program.uniforms.mouseInfluence.value = mouseInfluenceRef.current;

      renderer.render({ scene: mesh });
      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (gl.canvas.parentNode) container.removeChild(gl.canvas);
      geometry.remove();
      program.remove();
    };
  }, [enableRainbow, gridColor, rippleIntensity, gridSize, gridThickness, vignetteStrength, glowIntensity, opacity, gridRotation, mouseInteraction, mouseInteractionRadius]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }} />;
};

export default RippleGrid;
