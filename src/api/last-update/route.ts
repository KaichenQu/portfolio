import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    // Get the last commit date
    const lastCommitDate = execSync("git log -1 --format=%cd", {
      encoding: "utf-8",
    }).trim();

    return NextResponse.json({
      lastUpdate: new Date(lastCommitDate).toISOString(),
      gitLastCommit: lastCommitDate,
    });
  } catch (error) {
    console.error("Error getting last commit date:", error);
    return NextResponse.json(
      { error: "Failed to get last update time" },
      { status: 500 }
    );
  }
}
