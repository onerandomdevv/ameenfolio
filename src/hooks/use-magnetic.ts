import { useState, useRef, useEffect } from "react";

export function useMagnetic(strength = 0.5) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;
      
      // Only activate within a certain radius
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      const radius = 100;

      if (distance < radius) {
        setPosition({ 
          x: distanceX * strength, 
          y: distanceY * strength 
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [strength]);

  return { ref, x: position.x, y: position.y };
}
