"use client";

import React, { useEffect, useRef } from "react";

export function PixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let pixels: Pixel[] = [];
    const pixelSize = 4;
    const pixelCount = 100;

    class Pixel {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      size: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || 0);
        this.y = Math.random() * (canvas?.height || 0);
        this.speed = 0.5 + Math.random() * 1.5;
        this.opacity = 0.1 + Math.random() * 0.4;
        this.size = Math.random() * pixelSize + 1;
      }

      update() {
        this.y -= this.speed;
        if (this.y < -this.size) {
          this.y = (canvas?.height || 0) + this.size;
          this.x = Math.random() * (canvas?.width || 0);
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      pixels = [];
      for (let i = 0; i < pixelCount; i++) {
        pixels.push(new Pixel());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pixels.forEach((pixel) => {
        pixel.update();
        pixel.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      init();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "#000" }}
    />
  );
}
