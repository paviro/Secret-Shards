import { useEffect, useRef, MutableRefObject, useState } from 'react';
import type { DetectionOverlay } from '../hooks/useQrScanner';

const FLASH_RISE_MS = 120;
const FLASH_WHITE_MS = 250;
const FLASH_FALL_MS = 1500;
const FLASH_TOTAL_MS = FLASH_RISE_MS + FLASH_FALL_MS;

interface CodeOverlayProps {
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    detectionsRef: MutableRefObject<DetectionOverlay[]>;
    overlayFlashRef: MutableRefObject<Map<string, number>>;
}

// Helper to compute homography matrix (3x3) mapping src points to dst points
// Src points are (0,0), (w,0), (w,h), (0,h)
// Dst points are the 4 corners from scanner
function computeHomography(
    src: [number, number][],
    dst: [number, number][]
): number[] {
    let a: number[][] = [];
    let b: number[] = [];

    for (let i = 0; i < 4; i++) {
        let x = src[i][0];
        let y = src[i][1];
        let u = dst[i][0];
        let v = dst[i][1];

        a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
        a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
        b.push(u);
        b.push(v);
    }

    // Gaussian elimination to solve Ax = b
    // This is a simplified solver for 8x8 system
    const n = 8;
    for (let i = 0; i < n; i++) {
        // Pivot
        let maxEl = Math.abs(a[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(a[k][i]) > maxEl) {
                maxEl = Math.abs(a[k][i]);
                maxRow = k;
            }
        }

        // Swap rows
        for (let k = i; k < n; k++) {
            let tmp = a[maxRow][k];
            a[maxRow][k] = a[i][k];
            a[i][k] = tmp;
        }
        let tmp = b[maxRow];
        b[maxRow] = b[i];
        b[i] = tmp;

        // Eliminate
        for (let k = i + 1; k < n; k++) {
            let c = -a[k][i] / a[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    a[k][j] = 0;
                } else {
                    a[k][j] += c * a[i][j];
                }
            }
            b[k] += c * b[i];
        }
    }

    // Back substitution
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += a[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / a[i][i];
    }

    // Return 3x3 matrix (last element is 1)
    return [...x, 1];
}

function matrixToCss(H: number[]) {
    // CSS matrix3d is column-major 4x4
    // H is row-major 3x3:
    // [0 1 2]
    // [3 4 5]
    // [6 7 8]

    // CSS:
    // a1 a2 a3 a4
    // b1 b2 b3 b4
    // c1 c2 c3 c4
    // d1 d2 d3 d4

    // Map H to CSS:
    // a1=H[0], b1=H[3], c1=0, d1=H[6]
    // a2=H[1], b2=H[4], c2=0, d2=H[7]
    // a3=0,    b3=0,    c3=1, d3=0
    // a4=H[2], b4=H[5], c4=0, d4=H[8]

    return `matrix3d(
        ${H[0]}, ${H[3]}, 0, ${H[6]},
        ${H[1]}, ${H[4]}, 0, ${H[7]},
        0, 0, 1, 0,
        ${H[2]}, ${H[5]}, 0, ${H[8]}
    )`;
}

// Helper to map video coordinates to container coordinates considering object-fit: cover
function mapVideoToContainer(
    x: number,
    y: number,
    videoWidth: number,
    videoHeight: number,
    containerWidth: number,
    containerHeight: number
): [number, number] {
    const videoRatio = videoWidth / videoHeight;
    const containerRatio = containerWidth / containerHeight;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > videoRatio) {
        // Container is wider - video is scaled to match width, top/bottom cropped
        scale = containerWidth / videoWidth;
        const scaledHeight = videoHeight * scale;
        offsetY = (containerHeight - scaledHeight) / 2;
    } else {
        // Container is taller - video is scaled to match height, left/right cropped
        scale = containerHeight / videoHeight;
        const scaledWidth = videoWidth * scale;
        offsetX = (containerWidth - scaledWidth) / 2;
    }

    return [
        x * scale + offsetX,
        y * scale + offsetY
    ];
}

export default function CodeOverlay({ videoRef, detectionsRef, overlayFlashRef }: CodeOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // We use a fixed size for the overlay content source rect
    const OVERLAY_SIZE = 200;

    useEffect(() => {
        const render = () => {
            if (!videoRef.current || !canvasRef.current || !containerRef.current) {
                requestRef.current = requestAnimationFrame(render);
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const container = containerRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
                requestRef.current = requestAnimationFrame(render);
                return;
            }

            // Match canvas size to container size (for manual mapping)
            if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }

            // Clear previous frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const hiResNow = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const now = Date.now();

            // Sync DOM elements
            const overlays = detectionsRef.current;
            const flashStates = overlayFlashRef.current;

            // 1. Draw Canvas Elements (Polygon + Flash)
            if (overlays.length) {
                for (const overlay of overlays) {
                    if (now - overlay.timestamp >= 500) continue;
                    const loc = overlay.location;
                    const status = overlay.status;

                    // Map coordinates manually to ensure consistency with DOM labels
                    const tl = mapVideoToContainer(loc.topLeftCorner.x, loc.topLeftCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight);
                    const tr = mapVideoToContainer(loc.topRightCorner.x, loc.topRightCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight);
                    const br = mapVideoToContainer(loc.bottomRightCorner.x, loc.bottomRightCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight);
                    const bl = mapVideoToContainer(loc.bottomLeftCorner.x, loc.bottomLeftCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight);

                    const path = new Path2D();
                    path.moveTo(tl[0], tl[1]);
                    path.lineTo(tr[0], tr[1]);
                    path.lineTo(br[0], br[1]);
                    path.lineTo(bl[0], bl[1]);
                    path.closePath();
                    ctx.lineWidth = 4;

                    if (status === 'success' || status === 'duplicate') {
                        ctx.strokeStyle = '#22c55e';
                        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
                    } else {
                        ctx.strokeStyle = '#ef4444';
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    }

                    ctx.stroke(path);
                    ctx.fill(path);

                    // Flash Effect
                    if ((status === 'success' || status === 'duplicate') && overlay.data) {
                        const flashStart = flashStates.get(overlay.data);
                        if (flashStart !== undefined) {
                            const elapsed = hiResNow - flashStart;
                            if (elapsed <= FLASH_TOTAL_MS) {
                                let intensity: number;
                                if (elapsed <= FLASH_RISE_MS) {
                                    const t = elapsed / FLASH_RISE_MS;
                                    intensity = 1 - (1 - t) * (1 - t);
                                    intensity = Math.min(intensity * 1.1, 1);
                                } else {
                                    const t = (elapsed - FLASH_RISE_MS) / FLASH_FALL_MS;
                                    intensity = Math.pow(1 - t, 1.4);
                                }

                                ctx.save();
                                ctx.globalCompositeOperation = 'lighter';
                                if (elapsed <= FLASH_WHITE_MS) {
                                    const whiteT = elapsed / FLASH_WHITE_MS;
                                    const whiteAlpha = 0.25 + 0.55 * (1 - (1 - whiteT) * (1 - whiteT));
                                    ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
                                    ctx.fill(path);
                                } else {
                                    const greenPhase = (elapsed - FLASH_WHITE_MS) / (FLASH_TOTAL_MS - FLASH_WHITE_MS);
                                    const easedGreen = 1 - (1 - Math.min(greenPhase, 1)) ** 1.2;
                                    const greenAlpha = 0.2 + 0.4 * (intensity * easedGreen);
                                    ctx.fillStyle = `rgba(110, 231, 183, ${greenAlpha})`;
                                    ctx.fill(path);
                                }
                                ctx.restore();
                            } else {
                                flashStates.delete(overlay.data);
                            }
                        }
                    }
                }
            }

            // 2. Update DOM Elements (Labels with Perspective)
            // We manually manage children to avoid React render loop overhead
            // Identify active overlays
            const activeOverlays = overlays.filter(o => now - o.timestamp < 500);

            // Remove stale DOM elements
            const children = Array.from(container.children) as HTMLElement[];
            const activeIds = new Set(activeOverlays.map(o => o.data || 'unknown'));

            children.forEach(child => {
                if (!activeIds.has(child.dataset.id || '')) {
                    child.remove();
                }
            });

            // Create/Update DOM elements
            activeOverlays.forEach(overlay => {
                const id = overlay.data || 'unknown';
                let el = container.querySelector(`[data-id="${CSS.escape(id)}"]`) as HTMLElement;

                if (!el) {
                    el = document.createElement('div');
                    el.dataset.id = id;
                    el.className = 'absolute top-0 left-0 flex flex-col items-center justify-center pointer-events-none origin-top-left will-change-transform';
                    el.style.width = `${OVERLAY_SIZE}px`;
                    el.style.height = `${OVERLAY_SIZE}px`;

                    // Inner content
                    const inner = document.createElement('div');
                    inner.className = 'flex flex-col items-center justify-center text-center';
                    el.appendChild(inner);

                    container.appendChild(el);
                }

                // Update Content
                const inner = el.firstElementChild as HTMLElement;
                const status = overlay.status;
                let label = overlay.label || (status === 'success' ? 'Scanned' : 'Error');

                let icon = '';
                let colorClass = '';
                let scale = 1;
                let opacity = 1;

                if (status === 'success' || status === 'duplicate') {
                    // Check flash state for animation sequence
                    const flashStart = overlay.data ? flashStates.get(overlay.data) : undefined;

                    if (flashStart) {
                        const elapsed = hiResNow - flashStart;

                        if (elapsed < 250) {
                            // Phase 1: Flash only (hide label)
                            opacity = 0;
                            scale = 0.5;
                        } else if (elapsed < 1100) {
                            // Phase 2: "Added!"
                            label = "Added!";

                            if (elapsed < 500) {
                                // Pop In (250-500ms): 0.5 -> 1.5
                                const t = (elapsed - 250) / 250;
                                scale = 0.5 + 1.0 * (1 - (1 - t) * (1 - t)); // Ease out
                            } else if (elapsed < 800) {
                                // Hold (500-800ms): 1.5
                                scale = 1.5;
                            } else {
                                // Scale Down (800-1100ms): 1.5 -> 1.0
                                const t = (elapsed - 800) / 300;
                                scale = 1.5 - 0.5 * (t * t); // Ease in
                            }
                            opacity = 1;
                        } else {
                            // Phase 3: Actual Label
                            scale = 1;
                            opacity = 1;
                        }
                    }

                    icon = `<div class="bg-green-500 text-white rounded-full p-2 mb-2 shadow-lg shadow-green-500/50"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>`;
                    colorClass = 'text-green-400 font-bold text-shadow-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-green-500/30';
                } else {
                    icon = `<div class="bg-red-500 text-white rounded-full p-2 mb-2 shadow-lg shadow-red-500/50"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;
                    colorClass = 'text-red-400 font-bold text-shadow-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-red-500/30';
                }

                // Apply animation styles
                inner.style.transform = `scale(${scale})`;
                inner.style.opacity = `${opacity}`;

                // Only update innerHTML if changed to avoid layout thrashing
                const newHTML = `${icon}<span class="${colorClass} text-lg whitespace-nowrap">${label}</span>`;
                if (inner.innerHTML !== newHTML) {
                    inner.innerHTML = newHTML;
                }

                // Compute Homography
                const src: [number, number][] = [
                    [0, 0],
                    [OVERLAY_SIZE, 0],
                    [OVERLAY_SIZE, OVERLAY_SIZE],
                    [0, OVERLAY_SIZE]
                ];
                const dst: [number, number][] = [
                    mapVideoToContainer(overlay.location.topLeftCorner.x, overlay.location.topLeftCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight),
                    mapVideoToContainer(overlay.location.topRightCorner.x, overlay.location.topRightCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight),
                    mapVideoToContainer(overlay.location.bottomRightCorner.x, overlay.location.bottomRightCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight),
                    mapVideoToContainer(overlay.location.bottomLeftCorner.x, overlay.location.bottomLeftCorner.y, video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight)
                ];

                const H = computeHomography(src, dst);
                const transform = matrixToCss(H);

                el.style.transform = transform;
            });

            // Cleanup stale flash handles
            if (flashStates.size) {
                const staleKeys: string[] = [];
                for (const [data, start] of flashStates) {
                    if (hiResNow - start > FLASH_TOTAL_MS) {
                        staleKeys.push(data);
                    }
                }
                staleKeys.forEach(key => flashStates.delete(key));
            }

            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [videoRef, detectionsRef, overlayFlashRef]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-20"
                style={{ perspective: '1000px' }}
            />
        </>
    );
}
