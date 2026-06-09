import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const GUARANTEED_WINNERS = ["jonathan", "enzo", "mehdi", "malo", "palo"];
const DOUBLE_PLAY_ALLOWED = ["romain"]; // 2 Romain dans la classe
const TOTAL_NON_GUARANTEED = 10;        // 13 joueurs - 3 garantis
const RANDOM_WINS_TARGET = 6;           // 6 gagnants parmi les 10 restants

function isGuaranteed(name: string) {
  return GUARANTEED_WINNERS.includes(name.trim().toLowerCase());
}

function isDoubleAllowed(name: string) {
  return DOUBLE_PLAY_ALLOWED.includes(name.trim().toLowerCase());
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");
  return neon(url);
}

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS pizza_concours (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      won BOOLEAN NOT NULL DEFAULT false,
      pizza_choice TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE pizza_concours ADD COLUMN IF NOT EXISTS pizza_choice TEXT`;
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    await ensureTable();
    const sql = getDb();

    const nameLower = name.trim().toLowerCase();

    // Vérifier combien de fois ce prénom a déjà joué
    const [{ count: alreadyPlayed }] = await sql`
      SELECT COUNT(*) as count FROM pizza_concours
      WHERE LOWER(name) = ${nameLower}
    `;
    const plays = parseInt(String(alreadyPlayed));
    const maxPlays = isDoubleAllowed(name) ? 2 : 1;

    if (plays >= maxPlays) {
      return NextResponse.json(
        { error: "Tu as déjà participé au concours !" },
        { status: 409 }
      );
    }

    // Calcul du résultat
    let won: boolean;

    if (isGuaranteed(name)) {
      // Toujours gagnant
      won = true;
    } else {
      // Probabilité dynamique pour garantir exactement RANDOM_WINS_TARGET gagnants
      const winnersRows = await sql`
        SELECT name FROM pizza_concours WHERE won = true
      `;
      const randomWins = winnersRows.filter(
        (r) => !GUARANTEED_WINNERS.includes(String(r.name).toLowerCase())
      ).length;

      const nonGuaranteedPlaysRows = await sql`
        SELECT name FROM pizza_concours
        WHERE LOWER(name) NOT IN ('jonathan', 'enzo', 'mehdi')
      `;
      const playsBeforeThis = nonGuaranteedPlaysRows.length;
      const remainingPlayers = TOTAL_NON_GUARANTEED - playsBeforeThis;
      const remainingWins = RANDOM_WINS_TARGET - randomWins;

      if (remainingPlayers <= 0 || remainingWins <= 0) {
        won = false;
      } else if (remainingWins >= remainingPlayers) {
        // Tous les joueurs restants doivent gagner pour atteindre l'objectif
        won = true;
      } else {
        const probability = remainingWins / remainingPlayers;
        won = Math.random() < probability;
      }
    }

    const rows = await sql`
      INSERT INTO pizza_concours (name, won)
      VALUES (${name.trim()}, ${won})
      RETURNING id
    `;

    const [{ count: winnersCount }] = await sql`
      SELECT COUNT(*) as count FROM pizza_concours WHERE won = true
    `;

    return NextResponse.json({
      won,
      id: rows[0].id,
      winnersCount: parseInt(String(winnersCount)),
      winnersLeft: 9 - parseInt(String(winnersCount)),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Enregistrer le choix de pizza
export async function PATCH(req: NextRequest) {
  try {
    const { id, pizzaChoice } = await req.json();
    if (!id || !pizzaChoice?.trim()) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }
    await ensureTable();
    const sql = getDb();
    await sql`
      UPDATE pizza_concours
      SET pizza_choice = ${pizzaChoice.trim()}
      WHERE id = ${parseInt(id)} AND won = true
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Admin : voir tous les participants
export async function GET(req: NextRequest) {
  const adminKey = req.nextUrl.searchParams.get("key");
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    await ensureTable();
    const sql = getDb();
    const rows = await sql`SELECT * FROM pizza_concours ORDER BY created_at DESC`;
    return NextResponse.json({ participants: rows, maxWinners: 9 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Admin : remettre à zéro
export async function DELETE(req: NextRequest) {
  try {
    const { adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    await ensureTable();
    const sql = getDb();
    await sql`DELETE FROM pizza_concours`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
