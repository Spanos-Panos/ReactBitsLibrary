/* eslint-disable react/no-unknown-property */
import React, { forwardRef, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, Mesh, ShaderMaterial } from "three";

type NormalizedRGB = [number, number, number];

const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

// Optimized Noise using vUv instead of gl_FragCoord for zoom stability
float noise(vec2 uv) {
  vec2 r = (e * sin(e * uv));
  return fract(r.x * r.y * (1.0 + uv.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  return rot * (uv - 0.5) + 0.5;
}

void main() {
  // Use UV coordinates so the pattern doesn't change size when zooming
  vec2 uv = rotateUvs(vUv, uRotation);
  float rnd = noise(vUv * 100.0); 
  
  float tOffset = uSpeed * uTime;
  vec2 tex = uv * uScale * 2.0;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec3 finalColor = uColor * pattern;
  // Apply noise grain based on intensity
  finalColor -= (rnd / 15.0) * uNoiseIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const SilkPlane = forwardRef<Mesh, any>(({ uniforms }, ref) => {
  const { viewport } = useThree();

  useFrame((state) => {
    if (ref && "current" in ref && ref.current) {
      const material = ref.current.material as ShaderMaterial;
      // Use state.clock.getElapsedTime() for smoother time than delta addition
      material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={ref} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
});

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}) => {
  const meshRef = useRef<Mesh>(null);

  const uniforms = useMemo(() => ({
    uSpeed: { value: speed },
    uScale: { value: scale },
    uNoiseIntensity: { value: noiseIntensity },
    uColor: { value: new Color(...hexToNormalizedRGB(color)) },
    uRotation: { value: rotation },
    uTime: { value: 0 },
  }), [speed, scale, noiseIntensity, color, rotation]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* ANTI-LAG: we cap dpr at 1.5. 
          R3F automatically handles the resize/zoom listener for the Canvas.
      */}
      <Canvas dpr={Math.min(window.devicePixelRatio, 1.5)} camera={{ position: [0, 0, 1] }}>
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
