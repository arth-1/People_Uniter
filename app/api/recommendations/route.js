import { NextResponse } from "next/server";
import { getRecommendations, upsertRecommendationScores } from "@/services/data";

export async function GET() {
  try {
    const recs = await getRecommendations(20);
    return NextResponse.json({ data: recs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of recommendations" }, { status: 400 });
    }
    const normalized = body.map((row) => ({
      user_id: row.user_id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      score: row.score,
    }));
    await upsertRecommendationScores(normalized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
