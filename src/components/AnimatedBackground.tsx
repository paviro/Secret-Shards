'use client';

import { useEffect, useRef } from 'react';

interface BackgroundBlob {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    t: number; // time offset for movement pattern
    speed: number;
}

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let animationFrameId: number;
        let width: number;
        let height: number;

        // Lightly animated blobs matching the hero gradient palette
        const blobs: BackgroundBlob[] = [
            { x: 0, y: 0, vx: 1, vy: 1, radius: 400, color: 'rgba(99, 102, 241, 0.15)', t: 0, speed: 0.003 },
            { x: 0, y: 0, vx: -1, vy: 1, radius: 500, color: 'rgba(59, 130, 246, 0.15)', t: 2, speed: 0.0025 },
            { x: 0, y: 0, vx: 1, vy: -1, radius: 350, color: 'rgba(168, 85, 247, 0.12)', t: 4, speed: 0.0035 },
        ];

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            // Set canvas size to window size
            canvas.width = width;
            canvas.height = height;
        };

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Use "screen" blend mode for nice glowing overlap
            ctx.globalCompositeOperation = 'screen';

            blobs.forEach((blob, index) => {
                // Move blobs in a Lissajous-like pattern for organic movement
                // Only update time if motion is NOT reduced
                if (!prefersReducedMotion) {
                    blob.t += blob.speed;
                }

                // Calculate position based on window size and time
                // We map the -1..1 sine wave output to a portion of the screen
                const x = (width * 0.5) + Math.cos(blob.t) * (width * 0.3) + Math.sin(blob.t * 0.5) * (width * 0.1);
                const y = (height * 0.5) + Math.sin(blob.t * 1.2) * (height * 0.3) + Math.cos(blob.t * 0.8) * (height * 0.1);

                // Pulse radius slightly (or keep static for reduced motion)
                const r = prefersReducedMotion
                    ? blob.radius
                    : blob.radius + Math.sin(blob.t * 2) * 30;

                // Create radial gradient
                // The gradient goes from the color at center to transparent at the radius
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                gradient.addColorStop(0, blob.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Only continue the animation loop if motion is NOT reduced
            if (!prefersReducedMotion) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        // Initial setup
        handleResize();
        window.addEventListener('resize', handleResize);
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none w-full h-full"
            style={{ opacity: 0.8 }} // Global opacity tweak if needed
        />
    );
}
