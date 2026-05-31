"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  round: boolean;
}

const COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
];

function createParticles(): Particle[] {
  const newParticles: Particle[] = [];
  for (let i = 0; i < 60; i++) {
    newParticles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      velocityX: (Math.random() - 0.5) * 6,
      velocityY: -(Math.random() * 4 + 2),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      round: Math.random() > 0.5,
    });
  }
  return newParticles;
}

export default function Confetti({ fireKey }: { fireKey: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (fireKey <= 0) return;
    // Seed and clear on the macrotask queue so the burst is driven entirely
    // by async callbacks (no synchronous setState inside the effect body).
    const spawn = setTimeout(() => setParticles(createParticles()), 0);
    const clear = setTimeout(() => setParticles([]), 3000);
    return () => {
      clearTimeout(spawn);
      clearTimeout(clear);
    };
  }, [fireKey]);

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.velocityX * 0.3,
            y: p.y + p.velocityY * 0.3,
            velocityY: p.velocityY + 0.15,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter((p) => p.y < 120)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: p.round ? "50%" : "2px",
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
