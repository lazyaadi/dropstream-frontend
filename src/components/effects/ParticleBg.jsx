import React, { useRef, useEffect } from "react";

export default function ParticleBg({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    resize();
    const observer = new ResizeObserver(() => resize());
    observer.observe(document.body);
    window.addEventListener("resize", resize);
    const color = theme === "light" ? "30,64,175" : "99,179,237";
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.6 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const alpha = theme === "light" ? 0.7 : 0.55;
        ctx.fillStyle = `rgba(${color},${alpha})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            const a = theme === "light" ? 0.35 : 0.16;
            ctx.strokeStyle = `rgba(${color},${a * (1 - d / 130)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { 
      cancelAnimationFrame(raf); 
      window.removeEventListener("resize", resize); 
      observer.disconnect();
    };
  }, [theme]);
  return (
    <canvas
      ref={ref}
      className={`fixed inset-0 w-full h-full pointer-events-none z-[-1] ${theme === "light" ? "opacity-50" : "opacity-30"}`}
    />
  );
}
