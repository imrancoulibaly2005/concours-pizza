"use client";

import { useState, useEffect, useRef } from "react";

const REEL_SYMBOLS = ["🍕", "🧀", "🍅", "🫒", "🧅", "🌶️", "🥓"];
const WIN_SYMBOL = "🍕";

function useReel(spinning: boolean, finalSymbol: string, delay: number) {
  const [symbol, setSymbol] = useState("🍕");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        setSymbol(REEL_SYMBOLS[i % REEL_SYMBOLS.length]);
        i++;
      }, 80);
      const stop = setTimeout(() => {
        clearInterval(intervalRef.current!);
        setSymbol(finalSymbol);
      }, delay);
      return () => {
        clearInterval(intervalRef.current!);
        clearTimeout(stop);
      };
    }
  }, [spinning, finalSymbol, delay]);

  return symbol;
}

export default function ConcoursPage() {
  const [step, setStep] = useState<"form" | "spinning" | "result">("form");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [won, setWon] = useState(false);
  const [winnersLeft, setWinnersLeft] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finals, setFinals] = useState(["🍕", "🍕", "🍕"]);

  const r1 = useReel(isSpinning, finals[0], 900);
  const r2 = useReel(isSpinning, finals[1], 1300);
  const r3 = useReel(isSpinning, finals[2], 1700);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
      @keyframes wiggle { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes confetti { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
      @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{box-shadow:0 0 40px rgba(255,215,0,0.8)} }
    `;
    document.head.appendChild(style);
  }, []);

  const CONFETTI_COLORS = ["#ff6b35", "#ffd700", "#ff1744", "#00e676", "#2979ff", "#ff4081"];
  const confetti = won && step === "result"
    ? Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${(i * 4.3) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${(i * 0.12) % 2}s`,
        size: `${7 + (i % 7)}px`,
        duration: `${2.5 + (i % 3) * 0.5}s`,
      }))
    : [];

  async function handlePlay() {
    if (!name.trim()) { setError("Entre ton prénom pour jouer !"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/concours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      const isWin = data.won;
      setWon(isWin);
      setWinnersLeft(9 - data.winnersCount);

      if (isWin) {
        setFinals([WIN_SYMBOL, WIN_SYMBOL, WIN_SYMBOL]);
      } else {
        setFinals([
          REEL_SYMBOLS[1 + (Math.floor(Math.random() * (REEL_SYMBOLS.length - 1)))],
          WIN_SYMBOL,
          REEL_SYMBOLS[1 + (Math.floor(Math.random() * (REEL_SYMBOLS.length - 1)))],
        ]);
      }

      setStep("spinning");
      setIsSpinning(true);

      setTimeout(() => {
        setIsSpinning(false);
        setTimeout(() => setStep("result"), 400);
      }, 1700);
    } catch {
      setError("Une erreur s'est produite, réessaie !");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center px-4 py-8 gap-4"
      style={{ background: "linear-gradient(160deg, #1a0a00 0%, #2d1200 45%, #1a0a00 100%)" }}
    >
      {/* Confetti gagnant */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="fixed pointer-events-none rounded-sm"
          style={{
            left: c.left, top: "-10px",
            width: c.size, height: c.size,
            backgroundColor: c.color,
            animation: `confetti ${c.duration} ${c.delay} ease-in infinite`,
          }}
        />
      ))}

      {/* Décor ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `radial-gradient(circle, rgba(255,107,53,0.08), transparent)`,
              left: `${(i * 22) % 85}%`,
              top: `${(i * 19) % 80}%`,
              animation: `float ${4 + i * 0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* En-tête pizzeria */}
      <div className="relative z-10 text-center space-y-0.5">
        <p className="text-xs uppercase tracking-[0.35em] font-bold" style={{ color: "#ff6b35" }}>
          Les Sentimentales
        </p>
        <h1 className="text-3xl font-black text-white">
          🍕 Jeu Concours
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          9 pizzas offertes à gagner !
        </p>
      </div>

      {/* Carte principale */}
      <div
        className="relative z-10 w-full max-w-xs rounded-3xl p-6"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,107,53,0.25)",
          boxShadow: "0 0 60px rgba(255,107,53,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
          animation: "slideUp 0.4s ease-out",
        }}
      >
        {/* FORMULAIRE */}
        {step === "form" && (
          <div className="space-y-5">
            <div
              className="rounded-2xl px-4 py-3 text-center text-xs leading-relaxed"
              style={{
                background: "rgba(255,107,53,0.1)",
                border: "1px solid rgba(255,107,53,0.2)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Aligne <span style={{ color: "#ffd700", fontWeight: "bold" }}>3 🍕</span> pour gagner
              une pizza taille <strong style={{ color: "#ff6b35" }}>M</strong> au choix
              parmi Les Sentimentales 🎰
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>
                Ton prénom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlay()}
                placeholder="Ex: Marie..."
                className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "2px solid rgba(255,107,53,0.35)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ff6b35")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,107,53,0.35)")}
              />
              {error && (
                <p className="text-xs text-center px-3 py-1.5 rounded-xl"
                  style={{ color: "#ff6b35", background: "rgba(255,107,53,0.12)" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handlePlay}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-wide transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #ff1744)",
                color: "#fff",
                boxShadow: "0 8px 30px rgba(255,107,53,0.45)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              {loading ? "⏳ Préparation..." : "🎰 Tenter ma chance !"}
            </button>

            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              1 participation par personne
            </p>
          </div>
        )}

        {/* MACHINE À SOUS */}
        {(step === "spinning" || step === "result") && (
          <div className="space-y-5 text-center">
            <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              {step === "spinning" ? "🎰 Les rouleaux tournent..." : won ? "🎉 Résultat !" : "😔 Résultat"}
            </p>

            {/* Rouleaux */}
            <div className="flex gap-3 justify-center">
              {[r1, r2, r3].map((sym, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: "74px",
                    height: "74px",
                    background: isSpinning
                      ? "rgba(255,107,53,0.12)"
                      : step === "result" && won
                        ? "rgba(255,215,0,0.15)"
                        : "rgba(255,255,255,0.06)",
                    border: isSpinning
                      ? "2px solid rgba(255,107,53,0.35)"
                      : step === "result" && won
                        ? "2px solid #ffd700"
                        : "2px solid rgba(255,255,255,0.08)",
                    animation: step === "result" && won ? "glow 1.5s ease-in-out infinite" : "none",
                    animationDelay: `${i * 0.2}s`,
                    transition: "all 0.3s",
                    fontSize: "36px",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      animation: isSpinning
                        ? `wiggle 0.15s linear infinite`
                        : step === "result" && won
                          ? `float 2s ease-in-out infinite`
                          : "none",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  >
                    {sym}
                  </span>
                </div>
              ))}
            </div>

            {/* Résultat */}
            {step === "result" && (
              <div style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)" }}>
                {won ? (
                  <div className="space-y-3">
                    <div className="text-4xl">🏆</div>
                    <div>
                      <p className="font-black text-xl" style={{ color: "#ffd700" }}>FÉLICITATIONS !</p>
                      <p className="font-bold text-white text-sm mt-0.5">{name}, tu as gagné !</p>
                    </div>
                    <div
                      className="rounded-2xl px-4 py-4 space-y-1 text-center"
                      style={{
                        background: "rgba(255,215,0,0.1)",
                        border: "1px solid rgba(255,215,0,0.35)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-widest font-bold" style={{ color: "#ffd700" }}>Ton lot</p>
                      <p className="font-black text-white text-lg">🍕 Pizza taille M</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Au choix parmi Les Sentimentales
                      </p>
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,215,0,0.2)" }}>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Présente ce message à la soirée pour récupérer ta pizza 🎉
                        </p>
                      </div>
                    </div>
                    {winnersLeft !== null && winnersLeft > 0 && (
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Encore {winnersLeft} pizza{winnersLeft > 1 ? "s" : ""} à remporter !
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-4xl">🍅</div>
                    <div>
                      <p className="font-black text-xl text-white">Pas de chance !</p>
                      <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Dommage {name}, les rouleaux ne t&apos;ont pas souri…
                      </p>
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: "rgba(255,107,53,0.08)",
                        border: "1px solid rgba(255,107,53,0.18)",
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      Bonne soirée quand même ! 🎉
                    </div>
                    {winnersLeft !== null && winnersLeft > 0 && (
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Il reste encore {winnersLeft} pizza{winnersLeft > 1 ? "s" : ""} à gagner !
                      </p>
                    )}
                    {winnersLeft === 0 && (
                      <p className="text-xs font-bold" style={{ color: "#ff6b35" }}>
                        Toutes les pizzas ont été remportées !
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lien admin discret */}
      <a
        href="/admin"
        className="fixed bottom-4 right-4 z-50 text-xs transition-colors"
        style={{ color: "rgba(255,255,255,0.15)" }}
      >
        ⚙️
      </a>
    </main>
  );
}
