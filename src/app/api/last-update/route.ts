import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get last update time" },
      { status: 500 }
    );
  }
}
