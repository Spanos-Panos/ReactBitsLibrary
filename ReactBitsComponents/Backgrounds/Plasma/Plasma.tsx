import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

interface PlasmaProps {
  color?: string;
  speed?: number;
  scale?: number;
  opacity?: number;
  twist?: number;
  topWidth?: number;
  bottomWidth?: number;
  flarePow?: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.2, 0.5, 1.0]; 
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColor;
uniform float uScale;
uniform float uOpacity;
uniform float uTwist;
uniform float uTopWidth;
uniform float uBottomWidth;
uniform float uFlarePow;

out vec4 fragColor;

// --- NOISE ENGINE ---
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float ridgedFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * (1.0 - abs(snoise(p)));
        p *= 2.8;
        a *= 0.5;
    }
    return v;
}

mat2 rotate(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float ratio = iResolution.x / iResolution.y;
    vec2 p = (uv - 0.5);
    p.x *= ratio;
    p /= uScale;

    float h = uv.y;

    // --- GEOMETRY ---
    float flare = mix(uBottomWidth, uTopWidth, pow(h, uFlarePow));
    float twistVal = h * uTwist - iTime * 4.0;
    vec2 twistedP = rotate(twistVal) * p;
    float wiggle = sin(twistVal * 0.5) * flare * 0.3;
    float dist = abs(p.x + wiggle);

    // --- NOISE ---
    vec2 warp = vec2(snoise(p * 2.0), snoise(p * 2.0 + 10.0));
    vec2 noiseSt = vec2(twistedP.x * 3.0, p.y * 1.5 - iTime * 1.2) + warp * 0.3;
    
    float n = ridgedFbm(noiseSt);
    
    // DENSITY CALCULATION (Crucial for white background)
    // We sharpen the noise but keep enough mid-tones for "body"
    float density = smoothstep(0.2, 0.8, n);
    density = pow(density, 1.2);

    // --- EDGE MASK ---
    float edgeMask = smoothstep(flare * 1.2, flare * 0.0, dist);
    edgeMask = pow(edgeMask, 1.5);

    // --- COLOR & DEPTH ---
    // On white, we need internal shadows. We use the noise to create "Dark" smoke.
    vec3 smokeColor = uColor;
    vec3 shadowColor = smokeColor * 0.4; // Darker version for depth
    
    // Mix between shadow and main color based on noise
    vec3 finalCol = mix(shadowColor, smokeColor, n);
    
    // Add a tiny bit of "core light" only if it's dense
    finalCol += 0.2 * pow(n, 4.0);

    // --- FINAL ALPHA ---
    // Increase base visibility so it doesn't look thin
    float alpha = density * edgeMask;
    
    // Separation from background: Increase alpha strength
    alpha = clamp(alpha * 1.5, 0.0, 1.0);
    
    // Bounds & Fades
    alpha *= smoothstep(0.0, 0.1, h); 
    alpha *= smoothstep(1.0, 0.75, h);

    // We use uOpacity as a global multiplier
    fragColor = vec4(finalCol, alpha * uOpacity);
}
`;

export const Plasma: React.FC<PlasmaProps> = ({
  color = '#3498db',
  speed = 1,
  scale = 1,
  opacity = 1,
  twist = 12.0,
  topWidth = 0.6,
  bottomWidth = 0.02,
  flarePow = 2.0
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: true,
      // IMPORTANT: Premultiplied alpha ensures clean edges on white backgrounds
      premultipliedAlpha: false, 
      dpr: Math.min(window.devicePixelRatio, 1.5)
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true, // Critical for non-black backgrounds
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([0, 0]) },
        uColor: { value: new Float32Array(hexToRgb(color)) },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uTwist: { value: twist },
        uTopWidth: { value: topWidth },
        uBottomWidth: { value: bottomWidth },
        uFlarePow: { value: flarePow }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height);
      program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
      program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const update = (t: number) => {
      program.uniforms.iTime.value = t * 0.001 * speed;
      renderer.render({ scene: mesh });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      if (gl.canvas.parentNode) container.removeChild(gl.canvas);
      geometry.remove();
      program.remove();
    };
  }, [color, speed, scale, opacity, twist, topWidth, bottomWidth, flarePow]);

  return <div ref={containerRef} className="plasma-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
};

export default Plasma;
