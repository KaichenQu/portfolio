import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const resumeDir = path.join(process.cwd(), "public", "resume");

    if (!fs.existsSync(resumeDir)) {
      return NextResponse.json({ error: "Resume directory not found" }, { status: 404 });
    }

    const files = fs.readdirSync(resumeDir).filter((f) => f.endsWith(".pdf"));

    if (files.length === 0) {
      return NextResponse.json({ error: "No resume found" }, { status: 404 });
    }

    return NextResponse.json({ filename: files[0] });
  } catch (error) {
    console.error("Error reading resume directory:", error);
    return NextResponse.json({ error: "Failed to read resume" }, { status: 500 });
  }
}
