"use client";

import { useState, useEffect, useRef } from "react";
import { decodeResult } from "@/app/lib/codec";

type R = { w: boolean; i: number; l: number }
type RS = { s: number }

const REEL_SYMBOLS = ["🍕", "🧀", "🍅", "🫒", "🧅", "🌶️", "🥓"];
const WIN_SYMBOL = "🍕";

const TOUTES_LES_PIZZAS = [
  // ── Les Sentimentales ──
  { category: "Les Sentimentales", name: "Italia",       ingredients: "Sauce tomate, mozzarella, jambon, bacon, basilic, tomates, taleggio, filet de crème" },
  { category: "Les Sentimentales", name: "Bassin",       ingredients: "Crème fraîche légère, mozzarella, poulet tikka, champignons, Boursin, oignons" },
  { category: "Les Sentimentales", name: "Buffalo Bill", ingredients: "Sauce barbecue, mozzarella, pepperoni, jambon, olives, poivrons" },
  { category: "Les Sentimentales", name: "Chicken Chic", ingredients: "Crème fraîche légère, mozzarella, merguez, poulet pané, tomates, œuf, emmental, sauce barbecue" },
  { category: "Les Sentimentales", name: "Délice Amour", ingredients: "Sauce tomate, mozzarella, double chorizo, double lardons, chèvre, olives noires" },
  { category: "Les Sentimentales", name: "Ibère Fort",   ingredients: "Sauce tomate, mozzarella, pommes de terre, chorizo, parmesan, gorgonzola" },
  { category: "Les Sentimentales", name: "Tahitienne",   ingredients: "Sauce tomate, mozzarella, ananas, poulet tikka" },
  { category: "Les Sentimentales", name: "Océane",       ingredients: "Sauce tomate, mozzarella, thon, oignons rouges, olives noires, œuf" },
  { category: "Les Sentimentales", name: "Mexico",       ingredients: "Sauce tomate, mozzarella, double bœuf épicé, merguez, poivrons, sauce épicée" },
  { category: "Les Sentimentales", name: "Pack M",       ingredients: "Crème fraîche, sauce barbecue, mozzarella, double jambon, double poulet crousty, emmental" },
  { category: "Les Sentimentales", name: "Suprême",      ingredients: "Sauce tomate, mozzarella, poulet tikka, cheddar, merguez, oignons rouges" },
  { category: "Les Sentimentales", name: "Tartiflette",  ingredients: "Crème fraîche légère, mozzarella, reblochon, lardons, pommes de terre, oignons rouges" },
  { category: "Les Sentimentales", name: "5 Fromages",   ingredients: "Sauce tomate, mozzarella, chèvre, parmesan, camembert, reblochon" },
  { category: "Les Sentimentales", name: "Pizza Burger", ingredients: "Crème fraîche, emmental, cheddar, bœuf haché, potatoes, bacon, oignons rouges, œuf" },
  { category: "Les Sentimentales", name: "Méli Amour",   ingredients: "Crème fraîche, mozzarella, poulet tikka, miel, oignons rouges, chèvre" },
  { category: "Les Sentimentales", name: "Calzone",      ingredients: "Sauce tomate, double mozzarella, emmental, jambon — taille M et L uniquement" },
  { category: "Les Sentimentales", name: "Printanière",  ingredients: "Sauce tomate, mozzarella, tomates fraîches, lardons, chèvre, crème" },
  { category: "Les Sentimentales", name: "Kebab",        ingredients: "Sauce tomate, mozzarella, viande kebab volaille, tomates fraîches, oignons rouges, sauce blanche" },
  { category: "Les Sentimentales", name: "Bolognaise",   ingredients: "Sauce bolognaise, mozzarella, bœuf épicé, poivron" },
  { category: "Les Sentimentales", name: "Raclette",     ingredients: "Crème fraîche légère, mozzarella, pommes de terre, raclette, chorizo" },
  // ── Les Magistrales ──
  { category: "Les Magistrales", name: "Pizzarabia",   ingredients: "Sauce tomate, mozzarella, double bœuf haché, oignons rouges, olives vertes, huile d'olive, tomates séchées, épices" },
  { category: "Les Magistrales", name: "Pizza Amour",  ingredients: "Sauce tomate, mozzarella, bacon, bœuf haché, poulet crousty, crème fraîche, emmental, origan" },
  { category: "Les Magistrales", name: "Le Thaï",      ingredients: "Crème fraîche légère, mozzarella, sauce thaïlandaise épicée, bœuf haché, poulet croustillant, tomates séchées, olives noires" },
  { category: "Les Magistrales", name: "Saint-Jacques", ingredients: "Crème fraîche légère, mozzarella, ciboulette, noix de saint-jacques, jus de citron" },
  { category: "Les Magistrales", name: "Cannibale",    ingredients: "Sauce barbecue, mozzarella, bœuf épicé, merguez, poulet tikka" },
  { category: "Les Magistrales", name: "Hawaienne",    ingredients: "Crème fraîche légère, mozzarella, double jambon, ananas, œuf" },
  { category: "Les Magistrales", name: "Nordica",      ingredients: "Crème fraîche légère, mozzarella, olives noires, jus de citron, double saumon, ciboulette" },
  { category: "Les Magistrales", name: "Fromagère",    ingredients: "Crème fraîche légère, mozzarella, sauce barbecue, jambon, gorgonzola, parmesan, emmental" },
  { category: "Les Magistrales", name: "Extra Amour",  ingredients: "Sauce tomate, jambon, double mozzarella, pepperoni, lardons, poivrons, champignons, bœuf épicé, olives noires" },
  { category: "Les Magistrales", name: "La Grecque",   ingredients: "Crème fraîche légère, mozzarella, sauce barbecue, bœuf haché, tomate, merguez, feta" },
  { category: "Les Magistrales", name: "Indienne",     ingredients: "Crème fraîche légère, poulet tikka, chèvre, emmental, oignons rouges, miel, épices indiennes" },
  { category: "Les Magistrales", name: "Cordon Bleu",  ingredients: "Crème fraîche, cordon bleu, jambon, pommes de terre, oignons, filet de sauce barbecue" },
  { category: "Les Magistrales", name: "Tacos",        ingredients: "Base fromagère, emmental, cheddar, merguez, poulet crousty, viande hachée, poivron, potatoes, épice mexicaine, filet de crème" },
  // ── Les Originales ──
  { category: "Les Originales", name: "Margharita",   ingredients: "Sauce tomate, emmental, mozzarella, fines herbes" },
  { category: "Les Originales", name: "Curry Amour",  ingredients: "Crème fraîche légère, mozzarella, pommes de terre, poulet tikka, oignons rouges, poivrons, curry" },
  { category: "Les Originales", name: "Spicy Bacon",  ingredients: "Crème fraîche, mozzarella, bacon, pommes de terre, oignons rouges, épices, poivrons, cheddar" },
  { category: "Les Originales", name: "Rustique",     ingredients: "Crème fraîche légère, mozzarella, champignons frais, lardons, œuf, oignons rouges" },
  { category: "Les Originales", name: "Canadienne",   ingredients: "Sauce barbecue, mozzarella, bacon, champignons, pepperoni, poivrons" },
  { category: "Les Originales", name: "Végétarienne", ingredients: "Sauce tomate, mozzarella, oignons rouges, poivrons, pommes de terre, champignons frais, tomates fraîches, olives noires" },
  { category: "Les Originales", name: "Reine",        ingredients: "Sauce tomate, double mozzarella, champignons frais, double jambon" },
  { category: "Les Originales", name: "Fruits de mer", ingredients: "Crème fraîche légère, mozzarella, ciboulette, jus de citron, cocktail de fruits de mer" },
  { category: "Les Originales", name: "Tex-Mex",      ingredients: "Crème fraîche légère, mozzarella, bœuf épices mexicaine, oignons rouges, poivrons, pommes de terre" },
  { category: "Les Originales", name: "Santa Fé",     ingredients: "Sauce tomate, mozzarella, double merguez, chorizo, olives noires" },
  { category: "Les Originales", name: "Kentucky",     ingredients: "Sauce tomate, mozzarella, champignons frais, poulet tikka, oignons rouges, olives noires, filet de crème" },
];

function useReel(spinning: boolean, finalSymbol: string, delay: number) {
  const [symbol, setSymbol] = useState("🍕");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref pour éviter les stale closures — toujours la dernière valeur
  const finalRef = useRef(finalSymbol);
  finalRef.current = finalSymbol;

  useEffect(() => {
    if (spinning) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        setSymbol(REEL_SYMBOLS[i % REEL_SYMBOLS.length]);
        i++;
      }, 80);
      const stop = setTimeout(() => {
        clearInterval(intervalRef.current!);
        setSymbol(finalRef.current); // Lit la ref, jamais stale
      }, delay);
      return () => {
        clearInterval(intervalRef.current!);
        clearTimeout(stop);
      };
    }
  }, [spinning, delay]); // finalSymbol retiré des deps — géré via ref

  return symbol;
}

export default function ConcoursPage() {
  const [step, setStep] = useState<"form" | "spinning" | "won" | "menu" | "choose" | "confirmed" | "lost">("form");
  const [menuImg, setMenuImg] = useState(0); // 0=sentimentales, 1=magistrales, 2=originales
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [winnersLeft, setWinnersLeft] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finals, setFinals] = useState(["🍕", "🍕", "🍕"]);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [selectedPizza, setSelectedPizza] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const showConfetti = (step === "won" || step === "menu" || step === "choose" || step === "confirmed");
  const confetti = showConfetti
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
      const raw = await res.json();
      if (res.status === 409) {
        setError("Tu as déjà participé au concours !");
        return;
      }
      if (!res.ok) throw new Error();

      const data = decodeResult<R>(raw.d);

      setWinnersLeft(data.l);
      setParticipantId(data.i);

      if (data.w) {
        setFinals([WIN_SYMBOL, WIN_SYMBOL, WIN_SYMBOL]);
      } else {
        setFinals([
          REEL_SYMBOLS[1 + Math.floor(Math.random() * (REEL_SYMBOLS.length - 1))],
          WIN_SYMBOL,
          REEL_SYMBOLS[1 + Math.floor(Math.random() * (REEL_SYMBOLS.length - 1))],
        ]);
      }

      setStep("spinning");
      setIsSpinning(true);
      setTimeout(() => {
        setIsSpinning(false);
        setTimeout(() => setStep(data.w ? "won" : "lost"), 400);
      }, 1700);
    } catch {
      setError("Une erreur s'est produite, réessaie !");
    } finally {
      setLoading(false);
    }
  }

  async function handleChoose() {
    if (!selectedPizza || !participantId) return;
    setSaving(true);
    try {
      await fetch("/api/concours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: participantId, c: selectedPizza }),
      });
      setStep("confirmed");
    } catch {
      // silently fail, choice not critical
      setStep("confirmed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center px-4 py-8 gap-4"
      style={{ background: "linear-gradient(160deg, #1a0a00 0%, #2d1200 45%, #1a0a00 100%)" }}
    >
      {/* Modale zoom image */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setZoomedImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedImg}
            alt="Menu"
            className="max-w-full max-h-full rounded-xl"
            style={{ objectFit: "contain", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            onClick={() => setZoomedImg(null)}
          >✕</button>
        </div>
      )}

      {/* Confetti */}
      {confetti.map((c) => (
        <div key={c.id} className="fixed pointer-events-none rounded-sm"
          style={{ left: c.left, top: "-10px", width: c.size, height: c.size,
            backgroundColor: c.color, animation: `confetti ${c.duration} ${c.delay} ease-in infinite` }} />
      ))}

      {/* Décor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: `${100 + i * 50}px`, height: `${100 + i * 50}px`,
              background: `radial-gradient(circle, rgba(255,107,53,0.07), transparent)`,
              left: `${(i * 22) % 85}%`, top: `${(i * 19) % 80}%`,
              animation: `float ${4 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>

      {/* En-tête */}
      <div className="relative z-10 text-center space-y-0.5">
        <p className="text-xs uppercase tracking-[0.35em] font-bold" style={{ color: "#ff6b35" }}>
          Amour de Pizza
        </p>
        <h1 className="text-3xl font-black text-white">🍕 Jeu Concours</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>9 pizzas offertes à gagner !</p>
      </div>

      {/* Carte */}
      <div className="relative z-10 w-full max-w-xs rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,107,53,0.25)",
          boxShadow: "0 0 60px rgba(255,107,53,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
          animation: "slideUp 0.4s ease-out" }}>

        {/* ── FORMULAIRE ── */}
        {step === "form" && (
          <div className="space-y-5">
            <div className="rounded-2xl px-4 py-3 text-center text-xs leading-relaxed"
              style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)",
                color: "rgba(255,255,255,0.7)" }}>
              Aligne <span style={{ color: "#ffd700", fontWeight: "bold" }}>3 🍕</span> pour gagner
              une pizza au choix <strong style={{ color: "#ff6b35" }}>chez Amour de Pizza</strong> 🎰
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.4)" }}>Ton prénom</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlay()}
                placeholder="Ex: Marie..."
                className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:opacity-30"
                style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,107,53,0.35)", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#ff6b35")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,107,53,0.35)")} />
              {error && <p className="text-xs text-center px-3 py-1.5 rounded-xl"
                style={{ color: "#ff6b35", background: "rgba(255,107,53,0.12)" }}>{error}</p>}
            </div>
            <button onClick={handlePlay} disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-wide transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff1744)", color: "#fff",
                boxShadow: "0 8px 30px rgba(255,107,53,0.45)", animation: "pulse 2s ease-in-out infinite" }}>
              {loading ? "⏳ Préparation..." : "🎰 Tenter ma chance !"}
            </button>
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              1 participation par personne
            </p>
          </div>
        )}

        {/* ── MACHINE À SOUS ── */}
        {(step === "spinning" || step === "won" || step === "lost") && (
          <div className="space-y-5 text-center">
            <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              {step === "spinning" ? "🎰 Les rouleaux tournent..." : step === "won" ? "🎉 Résultat !" : "😔 Résultat"}
            </p>

            <div className="flex gap-3 justify-center">
              {[r1, r2, r3].map((sym, i) => (
                <div key={i} className="flex items-center justify-center rounded-2xl"
                  style={{ width: "74px", height: "74px",
                    background: isSpinning ? "rgba(255,107,53,0.12)" : step === "won" ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.06)",
                    border: isSpinning ? "2px solid rgba(255,107,53,0.35)" : step === "won" ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.08)",
                    animation: step === "won" ? "glow 1.5s ease-in-out infinite" : "none",
                    animationDelay: `${i * 0.2}s`, transition: "all 0.3s", fontSize: "36px", overflow: "hidden" }}>
                  <span style={{ display: "block",
                    animation: isSpinning ? "wiggle 0.15s linear infinite" : step === "won" ? "float 2s ease-in-out infinite" : "none",
                    animationDelay: `${i * 0.15}s` }}>
                    {sym}
                  </span>
                </div>
              ))}
            </div>

            {step === "won" && (
              <div style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)" }} className="space-y-3">
                <div className="text-4xl">🏆</div>
                <p className="font-black text-xl" style={{ color: "#ffd700" }}>FÉLICITATIONS !</p>
                <p className="text-white text-sm font-bold">{name}, tu as gagné une pizza !</p>
                <button onClick={() => { setMenuImg(0); setStep("menu"); }}
                  className="w-full py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #ffd700, #ff9500)", color: "#1a0a00",
                    boxShadow: "0 6px 25px rgba(255,215,0,0.4)" }}>
                  🍕 Voir le menu →
                </button>
              </div>
            )}

            {step === "lost" && (
              <div style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)" }} className="space-y-3">
                <div className="text-4xl">🍅</div>
                <p className="font-black text-xl text-white">Pas de chance !</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Dommage {name}, les rouleaux ne t&apos;ont pas souri…
                </p>
                <div className="rounded-2xl px-4 py-3"
                  style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.18)",
                    color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
                  Bonne soirée quand même ! 🎉
                </div>
                {winnersLeft !== null && winnersLeft > 0 && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Il reste encore {winnersLeft} pizza{winnersLeft > 1 ? "s" : ""} à gagner !
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MENU PHOTOS ── */}
        {step === "menu" && (
          <div className="space-y-4" style={{ animation: "slideUp 0.4s ease-out" }}>
            <div className="text-center">
              <p className="font-black text-lg text-white">📋 Le menu</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Consulte le menu puis fais ton choix
              </p>
            </div>

            {/* Onglets catégories */}
            <div className="flex gap-1.5">
              {[
                { label: "Sentimentales", color: "#ff6b35" },
                { label: "Magistrales",   color: "#c084fc" },
                { label: "Originales",    color: "#34d399" },
              ].map((cat, i) => (
                <button key={i} onClick={() => setMenuImg(i)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: menuImg === i ? cat.color : "rgba(255,255,255,0.07)",
                    color: menuImg === i ? "#fff" : "rgba(255,255,255,0.45)",
                    border: menuImg === i ? `2px solid ${cat.color}` : "2px solid rgba(255,255,255,0.08)",
                  }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Photo du menu — clique pour zoomer */}
            {(() => {
              const src = menuImg === 0 ? "/menu-sentimentales.jpg" : menuImg === 1 ? "/menu-magistrales.jpg" : "/menu-originales.jpg"
              return (
                <div className="relative rounded-2xl overflow-hidden cursor-zoom-in"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  onClick={() => setZoomedImg(src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Menu"
                    className="w-full object-contain"
                    style={{ maxHeight: "260px", objectPosition: "top" }}
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)" }}>
                    🔍 Agrandir
                  </div>
                </div>
              )
            })()}

            {/* Navigation rapide entre photos */}
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <button key={i} onClick={() => setMenuImg(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: menuImg === i ? "#ffd700" : "rgba(255,255,255,0.2)",
                    transform: menuImg === i ? "scale(1.3)" : "scale(1)",
                  }} />
              ))}
            </div>

            <button onClick={() => setStep("choose")}
              className="w-full py-3.5 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #ffd700, #ff9500)", color: "#1a0a00",
                boxShadow: "0 6px 25px rgba(255,215,0,0.35)" }}>
              🍕 Choisir ma pizza →
            </button>
          </div>
        )}

        {/* ── CHOIX DE LA PIZZA ── */}
        {step === "choose" && (
          <div className="space-y-4" style={{ animation: "slideUp 0.4s ease-out" }}>
            <div className="text-center">
              <div className="text-3xl mb-1">🍕</div>
              <h2 className="font-black text-lg text-white">Choisis ta pizza !</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Au choix chez Amour de Pizza
              </p>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "none" }}>
              {["Les Sentimentales", "Les Magistrales", "Les Originales"].map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-black uppercase tracking-widest px-1 py-2"
                    style={{ color: cat === "Les Sentimentales" ? "#ff6b35" : cat === "Les Magistrales" ? "#c084fc" : "#34d399" }}>
                    {cat}
                  </p>
                  {TOUTES_LES_PIZZAS.filter((p) => p.category === cat).map((pizza) => (
                    <button key={pizza.name} onClick={() => setSelectedPizza(pizza.name)}
                      className="w-full text-left rounded-2xl px-4 py-3 mb-1.5 transition-all"
                      style={{
                        background: selectedPizza === pizza.name ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.05)",
                        border: selectedPizza === pizza.name ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.07)",
                        boxShadow: selectedPizza === pizza.name ? "0 0 15px rgba(255,215,0,0.2)" : "none",
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">
                          {selectedPizza === pizza.name ? "✅" : "🍕"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white leading-tight">{pizza.name}</p>
                          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {pizza.ingredients}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <button onClick={handleChoose}
              disabled={!selectedPizza || saving}
              className="w-full py-3.5 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: selectedPizza ? "linear-gradient(135deg, #ffd700, #ff9500)" : "rgba(255,255,255,0.1)",
                color: selectedPizza ? "#1a0a00" : "rgba(255,255,255,0.4)",
                boxShadow: selectedPizza ? "0 6px 25px rgba(255,215,0,0.35)" : "none" }}>
              {saving ? "⏳ Enregistrement..." : selectedPizza ? `✅ Confirmer — ${selectedPizza}` : "Sélectionne une pizza"}
            </button>
          </div>
        )}

        {/* ── CONFIRMATION FINALE ── */}
        {step === "confirmed" && (
          <div className="space-y-4 text-center" style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)" }}>
            <div className="text-5xl">🎊</div>
            <div>
              <p className="font-black text-2xl" style={{ color: "#ffd700" }}>C&apos;est noté !</p>
              <p className="text-white text-sm font-semibold mt-1">{name}</p>
            </div>
            <div className="rounded-2xl px-4 py-4 space-y-2"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.35)" }}>
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: "#ffd700" }}>Ta pizza</p>
              <p className="font-black text-white text-xl">{selectedPizza} 🍕</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Chez Amour de Pizza</p>
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
        )}
      </div>

      <a href="/admin" className="fixed bottom-4 right-4 z-50 text-xs transition-colors"
        style={{ color: "rgba(255,255,255,0.12)" }}>⚙️</a>
    </main>
  );
}
