import { NextResponse } from "next/server";
import { JUGADOR_COOKIE } from "@/lib/jugadorAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(JUGADOR_COOKIE);
  return response;
}
