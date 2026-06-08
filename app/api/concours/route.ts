import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const MAX_WINNERS = 9;
const GUARANTEED_WINNERS = ["jonathan", "enzo", "mehdi"];

function isGuaranteed(name: string) {
  return GUARANTEED_WINNERS.includes(name.trim().toLowerCase());
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
  // Migration si la table existait déjà sans la colonne pizza_choice
  await sql`
    ALTER TABLE pizza_concours ADD COLUMN IF NOT EXISTS pizza_choice TEXT
  `;
}

// Jouer : soumettre son prénom
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    await ensureTable();
    const sql = getDb();

    const [{ count: winnersCount }] = await sql`
      SELECT COUNT(*) as count FROM pizza_concours WHERE won = true
    `;

    const currentWinners = parseInt(String(winnersCount));
    const guaranteed = isGuaranteed(name);
    const won = guaranteed || (currentWinners < MAX_WINNERS && Math.random() < 0.35);

    const rows = await sql`
      INSERT INTO pizza_concours (name, won)
      VALUES (${name.trim()}, ${won})
      RETURNING id
    `;

    const [{ count: totalCount }] = await sql`
      SELECT COUNT(*) as count FROM pizza_concours
    `;

    return NextResponse.json({
      won,
      id: rows[0].id,
      winnersCount: won ? currentWinners + 1 : currentWinners,
      totalParticipants: parseInt(String(totalCount)),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Choisir sa pizza après avoir gagné
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
    return NextResponse.json({ participants: rows, maxWinners: MAX_WINNERS });
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
