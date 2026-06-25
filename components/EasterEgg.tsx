"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// A valid Sudoku puzzle (0 = empty)
const PUZZLE: number[][] = [
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],
  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],
  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9],
];
const SOLUTION: number[][] = [
  [5,3,4, 6,7,8, 9,1,2],
  [6,7,2, 1,9,5, 3,4,8],
  [1,9,8, 3,4,2, 5,6,7],
  [8,5,9, 7,6,1, 4,2,3],
  [4,2,6, 8,5,3, 7,9,1],
  [7,1,3, 9,2,4, 8,5,6],
  [9,6,1, 5,3,7, 2,8,4],
  [2,8,7, 4,1,9, 6,3,5],
  [3,4,5, 2,8,6, 1,7,9],
];

interface Particle {
  el: HTMLElement;
  x: number; y: number;
  vx: number; vy: number;
  rotation: number;
  rotationSpeed: number;
  originalRect: DOMRect;
}

export function EasterEgg({ active, onReset }: { active: boolean; onReset: () => void }) {
  const [phase, setPhase] = useState<"idle" | "physics" | "sudoku">("idle");
  const [sudokuGrid, setSudokuGrid] = useState<number[][]>(() => PUZZLE.map(r => [...r]));
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!active || phase !== "idle") return;
    startPhysics();
  }, [active]);

  function startPhysics() {
    setPhase("physics");

    // Collect all visible elements to animate
    const selectors = [
      ".glass-card", "[class*='rounded-2xl']", "[class*='rounded-xl']",
      "nav", "h1", "h2", "button:not([data-easter-ignore])", "p", "a",
      "[class*='card-enter']", "table", "thead", "tbody", "tr", "td",
    ];
    const seen = new Set<Element>();
    const elements: HTMLElement[] = [];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!seen.has(el) && el instanceof HTMLElement && el.offsetParent !== null) {
          seen.add(el);
          elements.push(el);
        }
      });
    });

    // Limit to first 60 elements for perf
    const targets = elements.slice(0, 60);

    // Create clones that will animate, hide originals
    const particles: Particle[] = [];
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9980;overflow:hidden;";
    document.body.appendChild(container);

    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        margin: 0;
        pointer-events: none;
        transform-origin: center center;
        transition: none;
        z-index: 9981;
      `;
      container.appendChild(clone);

      // Hide original
      el.style.visibility = "hidden";

      particles.push({
        el: clone,
        x: rect.left,
        y: rect.top,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4 - 1,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 8,
        originalRect: rect,
      });
    });

    particlesRef.current = particles;
    (container as any).__originalEls = targets;

    const gravity = 0.4;
    const bounce = 0.35;
    const floor = window.innerHeight;

    function tick() {
      let allResting = true;
      particles.forEach(p => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Floor bounce
        if (p.y + p.originalRect.height >= floor) {
          p.y = floor - p.originalRect.height;
          p.vy *= -bounce;
          p.vx *= 0.85;
          p.rotationSpeed *= 0.85;
          if (Math.abs(p.vy) < 0.5) { p.vy = 0; }
        }

        p.el.style.transform = `translate(${p.x - p.originalRect.left}px, ${p.y - p.originalRect.top}px) rotate(${p.rotation}deg)`;

        if (Math.abs(p.vy) > 0.3 || p.y + p.originalRect.height < floor - 1) allResting = false;
      });

      if (allResting) {
        // Fade out container, show sudoku
        container.style.transition = "opacity 0.6s ease";
        container.style.opacity = "0";
        setTimeout(() => {
          container.remove();
          // Restore originals
          targets.forEach(el => { el.style.visibility = ""; });
          setSudokuGrid(PUZZLE.map(r => [...r]));
          setErrors(new Set());
          setSolved(false);
          setPhase("sudoku");
        }, 700);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  function handleInput(row: number, col: number, val: string) {
    if (PUZZLE[row][col] !== 0) return;
    const num = parseInt(val) || 0;
    if (num < 0 || num > 9) return;
    const newGrid = sudokuGrid.map(r => [...r]);
    newGrid[row][col] = num;
    setSudokuGrid(newGrid);

    // Validate
    const newErrors = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newGrid[r][c] !== 0 && newGrid[r][c] !== SOLUTION[r][c]) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);

    // Check solved
    const complete = newGrid.every((row, r) => row.every((v, c) => v === SOLUTION[r][c]));
    if (complete) setSolved(true);
  }

  function handleReset() {
    cancelAnimationFrame(rafRef.current);
    setPhase("idle");
    setSolved(false);
    onReset();
  }

  if (!mounted || phase === "idle") return null;

  if (phase === "physics") return null; // physics is DOM-based, no React needed

  // Sudoku overlay
  const sudokuUI = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9990,
      background: "rgba(5,2,20,0.92)", backdropFilter: "blur(24px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "16px",
      animation: "fadeInUp 0.4s ease both",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "24px", padding: "32px 28px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
        maxWidth: "420px", width: "100%",
      }}>
        {solved ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ color: "white", fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>¡Lo resolviste!</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 24px" }}>
              Sos un genio. El engranaje secreto ha sido conquistado.
            </p>
            <button onClick={handleReset} style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))",
              border: "none", borderRadius: "12px", padding: "10px 28px",
              color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}>Volver</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ color: "white", fontSize: "18px", fontWeight: 800, margin: 0 }}>🧩 Sudoku</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: "3px 0 0" }}>
                  Encontraste el easter egg 👀
                </p>
              </div>
              <button onClick={handleReset} data-easter-ignore="true" style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px", padding: "5px 12px", color: "rgba(255,255,255,0.7)",
                fontSize: "12px", cursor: "pointer",
              }}>Salir</button>
            </div>

            {/* Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(9,1fr)", gap: "2px",
              background: "rgba(99,102,241,0.8)", borderRadius: "10px", padding: "2px",
              border: "2px solid rgba(99,102,241,0.9)",
            }}>
              {sudokuGrid.map((row, r) =>
                row.map((val, c) => {
                  const fixed = PUZZLE[r][c] !== 0;
                  const error = errors.has(`${r}-${c}`);
                  const borderRight = (c === 2 || c === 5) ? "2px solid rgba(99,102,241,0.9)" : undefined;
                  const borderBottom = (r === 2 || r === 5) ? "2px solid rgba(99,102,241,0.9)" : undefined;
                  return (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      min={1} max={9}
                      value={val === 0 ? "" : val}
                      readOnly={fixed}
                      onChange={e => handleInput(r, c, e.target.value.slice(-1))}
                      style={{
                        width: "100%", aspectRatio: "1", textAlign: "center",
                        border: "none", outline: "none",
                        background: fixed ? "rgba(99,102,241,0.25)" : error ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
                        color: fixed ? "rgba(255,255,255,0.95)" : error ? "#fca5a5" : "rgba(255,255,255,0.85)",
                        fontSize: "clamp(11px,2vw,16px)", fontWeight: fixed ? 700 : 500,
                        cursor: fixed ? "default" : "text",
                        borderRight, borderBottom,
                        MozAppearance: "textfield",
                      } as React.CSSProperties}
                    />
                  );
                })
              )}
            </div>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginTop: "14px" }}>
              {errors.size > 0 ? `${errors.size} número${errors.size > 1 ? "s" : ""} incorrecto${errors.size > 1 ? "s" : ""}` : "Completá el sudoku para ganar 🏆"}
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(sudokuUI, document.body);
}
