import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use the build time as the last update time
    const buildTime = process.env.BUILD_TIME || new Date().toISOString();

    return NextResponse.json({
      lastUpdate: buildTime,
    });
  } catch (error) {
    console.error("Error getting last update time:", error);
    return NextResponse.json(
      { error: "Failed to get last update time" },
      { status: 500 }
    );
  }
}
