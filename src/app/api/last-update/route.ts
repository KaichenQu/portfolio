import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("git log -1 --format=%cd");
    return Response.json({ lastUpdate: new Date(stdout) });
  } catch (error) {
    return Response.json({ lastUpdate: new Date() });
  }
}
