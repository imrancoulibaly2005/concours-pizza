"use client";

import { useState } from "react";

type Participant = {
  id: number;
  name: string;
  won: boolean;
  pizza_choice: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState<{ participants: Participant[]; maxWinners: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/concours?key=${encodeURIComponent(key)}`);
      if (res.status === 401) { setError("Clé incorrecte"); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm("Remettre le concours à zéro ?")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/concours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: key }),
      });
      if (!res.ok) throw new Error();
      setData(null);
    } catch {
      alert("Erreur lors de la remise à zéro");
    } finally {
      setResetting(false);
    }
  }

  const winners = data?.participants.filter((p) => p.won) ?? [];
  const losers = data?.participants.filter((p) => !p.won) ?? [];
  const withChoice = winners.filter((p) => p.pizza_choice);
  const waitingChoice = winners.filter((p) => !p.pizza_choice);

  return (
    <main className="min-h-screen p-4"
      style={{ background: "linear-gradient(160deg, #1a0a00 0%, #2d1200 45%, #1a0a00 100%)" }}>
      <div className="max-w-sm mx-auto space-y-4 pt-4">

        <div className="text-center">
          <div className="text-3xl mb-1">🍕</div>
          <h1 className="text-xl font-black text-white">Admin Concours</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Les Sentimentales — 9 pizzas
          </p>
        </div>

        {!data && (
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,53,0.25)" }}>
            <label className="block text-xs font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}>Clé d&apos;accès</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,107,53,0.3)", color: "#fff" }} />
            {error && <p className="text-sm" style={{ color: "#ff6b35" }}>{error}</p>}
            <button onClick={load} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff1744)" }}>
              {loading ? "Chargement..." : "Accéder"}
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Gagnants", value: winners.length, icon: "🏆", color: "#ffd700" },
                { label: "Participants", value: data.participants.length, icon: "🎰", color: "#ff6b35" },
                { label: "Restantes", value: 9 - winners.length, icon: "🍕", color: "#00e676" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,53,0.15)" }}>
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Gagnants avec leur choix */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.25)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
                <h2 className="font-bold text-sm" style={{ color: "#ffd700" }}>
                  🏆 Gagnants ({winners.length}/9)
                </h2>
              </div>

              {winners.length === 0 && (
                <div className="px-4 py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Aucun gagnant pour l&apos;instant
                </div>
              )}

              {/* Avec choix de pizza */}
              {withChoice.map((p, i) => (
                <div key={p.id} className="px-4 py-3"
                  style={{ borderBottom: i < winners.length - 1 ? "1px solid rgba(255,215,0,0.06)" : "none" }}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                      style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700" }}>
                      {winners.indexOf(p) + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs">🍕</span>
                        <span className="text-xs font-semibold" style={{ color: "#ffd700" }}>
                          {p.pizza_choice}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(p.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {/* En attente de choix */}
              {waitingChoice.map((p, i) => (
                <div key={p.id} className="px-4 py-3"
                  style={{ borderBottom: i < waitingChoice.length - 1 ? "1px solid rgba(255,215,0,0.06)" : "none" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: "rgba(255,107,53,0.15)", color: "#ff6b35" }}>
                      {winners.indexOf(p) + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-xs" style={{ color: "rgba(255,107,53,0.7)" }}>
                        ⏳ Pas encore choisi…
                      </p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(p.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé des pizzas commandées */}
            {withChoice.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,53,0.2)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,107,53,0.1)" }}>
                  <h2 className="font-bold text-sm" style={{ color: "#ff6b35" }}>
                    📋 Récapitulatif commande
                  </h2>
                </div>
                {withChoice.map((p, i) => (
                  <div key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-2"
                    style={{ borderBottom: i < withChoice.length - 1 ? "1px solid rgba(255,107,53,0.06)" : "none" }}>
                    <span className="text-sm text-white font-medium">{p.name}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700" }}>
                      {p.pizza_choice}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Non-gagnants */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  😔 Non-gagnants ({losers.length})
                </h2>
              </div>
              {losers.length === 0 && (
                <div className="px-4 py-5 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Aucun
                </div>
              )}
              {losers.map((p, i) => (
                <div key={p.id} className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: i < losers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{p.name}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(p.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setData(null); setKey(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Déconnexion
              </button>
              <button onClick={handleReset} disabled={resetting}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,0,0,0.12)", color: "#ff6b35", border: "1px solid rgba(255,0,0,0.25)" }}>
                {resetting ? "..." : "🗑️ Remise à zéro"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
