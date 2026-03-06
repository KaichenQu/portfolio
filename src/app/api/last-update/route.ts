import { NextResponse } from "next/server";

export async function GET() {
  const lastUpdate = process.env.BUILD_TIME ?? new Date().toISOString();
  return NextResponse.json({ lastUpdate });
}
