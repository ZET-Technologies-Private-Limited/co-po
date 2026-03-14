"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import ProfessionalAbstract3D from "@/components/landing/ProfessionalAbstract3D";

export function LoginBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }}>
        <Suspense fallback={null}>
          <ProfessionalAbstract3D />
        </Suspense>
      </Canvas>
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-cosmic via-cosmic/40 to-cosmic" />
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic/70 via-transparent to-cosmic/70" />
    </div>
  );
}
