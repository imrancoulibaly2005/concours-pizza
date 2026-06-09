import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { encodeResult } from "@/app/lib/codec";

const GUARANTEED_WINNERS   = ["jonathan", "enzo", "mehdi", "malo", "palo"];
const GUARANTEED_UNIQUE    = 4;   // jonathan, enzo, mehdi, malo (palo = alias de malo)
const DOUBLE_PLAY_ALLOWED  = ["romain"];
const TOTAL_WINNERS        = 9;
const TOTAL_NON_GUARANTEED = 9;   // 13 joueurs - 4 garantis = 9 joueurs restants
const RANDOM_WINS_TARGET   = TOTAL_WINNERS - GUARANTEED_UNIQUE; // 9 - 4 = 5 places aléatoires

const ok  = () => encodeResult({ s: 1 })                    // générique OK
const nok = () => encodeResult({ s: 0 })                    // générique NOK

function isGuaranteed(name: string)   { return GUARANTEED_WINNERS.includes(name.trim().toLowerCase()) }
function isDoubleAllowed(name: string){ return DOUBLE_PLAY_ALLOWED.includes(name.trim().toLowerCase()) }

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("no db")
  return neon(url)
}

async function ensureTable() {
  const sql = getDb()
  await sql`CREATE TABLE IF NOT EXISTS pizza_concours (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL,
    won BOOLEAN NOT NULL DEFAULT false,
    pizza_choice TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
  )`
  await sql`ALTER TABLE pizza_concours ADD COLUMN IF NOT EXISTS pizza_choice TEXT`
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ d: nok() }, { status: 400 })

    await ensureTable()
    const sql = getDb()

    // Anti-double-jeu
    const existingRows = await sql`
      SELECT id, won, pizza_choice FROM pizza_concours
      WHERE LOWER(name) = ${name.trim().toLowerCase()}
      ORDER BY created_at DESC
    `
    const maxPlays = isDoubleAllowed(name) ? 2 : 1
    if (existingRows.length >= maxPlays) {
      // Si gagnant → renvoie ses infos pour retrouver sa commande
      const winner = existingRows.find(r => r.won)
      if (winner) {
        const [{ count: total }] = await sql`SELECT COUNT(*) as count FROM pizza_concours WHERE won = true`
        return NextResponse.json({
          d: encodeResult({
            s: -1,           // déjà joué
            w: true,         // a gagné
            i: winner.id,
            c: winner.pizza_choice ?? null,
            l: 9 - parseInt(String(total)),
          })
        }, { status: 409 })
      }
      // Perdant → message neutre
      return NextResponse.json({ d: encodeResult({ s: -1, w: false }) }, { status: 409 })
    }

    let won: boolean

    if (isGuaranteed(name)) {
      won = true
    } else {
      const allWinners = await sql`SELECT name FROM pizza_concours WHERE won = true`
      const randomWins = allWinners.filter(
        r => !GUARANTEED_WINNERS.includes(String(r.name).toLowerCase())
      ).length

      const nonGuaranteedPlays = await sql`
        SELECT name FROM pizza_concours WHERE LOWER(name) NOT IN ('jonathan','enzo','mehdi','malo','palo')
      `
      const playsBeforeThis  = nonGuaranteedPlays.length
      const remainingPlayers = TOTAL_NON_GUARANTEED - playsBeforeThis
      const remainingWins    = RANDOM_WINS_TARGET   - randomWins

      if (remainingPlayers <= 0 || remainingWins <= 0)          won = false
      else if (remainingWins >= remainingPlayers)               won = true
      else                                                       won = Math.random() < remainingWins / remainingPlayers
    }

    const rows = await sql`
      INSERT INTO pizza_concours (name, won) VALUES (${name.trim()}, ${won}) RETURNING id
    `
    const [{ count: total }] = await sql`SELECT COUNT(*) as count FROM pizza_concours WHERE won = true`

    // Réponse chiffrée — rien de lisible dans DevTools
    return NextResponse.json({
      d: encodeResult({ w: won, i: rows[0].id, l: 9 - parseInt(String(total)) })
    })

  } catch {
    return NextResponse.json({ d: nok() }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { t, c } = await req.json()   // t = token id, c = choix pizza
    if (!t || !c?.trim()) return NextResponse.json({ d: nok() }, { status: 400 })
    await ensureTable()
    const sql = getDb()
    await sql`UPDATE pizza_concours SET pizza_choice = ${c.trim()} WHERE id = ${parseInt(t)} AND won = true`
    return NextResponse.json({ d: ok() })
  } catch {
    return NextResponse.json({ d: nok() }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const adminKey = req.nextUrl.searchParams.get("key")
  if (adminKey !== process.env.ADMIN_KEY) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  try {
    await ensureTable()
    const sql = getDb()
    const rows = await sql`SELECT * FROM pizza_concours ORDER BY created_at DESC`
    return NextResponse.json({ participants: rows, maxWinners: 9 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { adminKey } = await req.json()
    if (adminKey !== process.env.ADMIN_KEY) return NextResponse.json({ d: nok() }, { status: 401 })
    await ensureTable()
    const sql = getDb()
    await sql`DELETE FROM pizza_concours`
    return NextResponse.json({ d: ok() })
  } catch {
    return NextResponse.json({ d: nok() }, { status: 500 })
  }
}
