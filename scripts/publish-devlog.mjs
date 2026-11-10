#!/usr/bin/env node
// Syncs the vault, then commits and pushes the two mirrored folders to main,
// which Vercel deploys. Refuses to sweep anything else into that commit.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultSync } from "./sync-devlog.mjs";

export const PATHS = ["content/devlog", "public/blog/diagrams"];
export const MESSAGE = "docs(devlog): sync notes";

/** Returns true when it committed and pushed, false when the sync changed nothing. */
export function publishDevlog({ root, sync = () => defaultSync(root) }) {
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== "main")
    throw new Error(`devlog:publish runs on main only (current: ${branch})`);
  const inside = (f) => PATHS.some((p) => f.startsWith(`${p}/`));
  const staged = git("diff", "--cached", "--name-only")
    .split("\n")
    .filter((f) => f && !inside(f));
  if (staged.length)
    throw new Error(
      `Unstage these first, they would ride along in the DevLog commit:\n${staged.join("\n")}`,
    );

  sync();
  // A pathspec that matches nothing on disk or in the index makes `git add` fail.
  const present = PATHS.filter(
    (p) => fs.existsSync(path.join(root, p)) || git("ls-files", "--", p),
  );
  if (present.length) git("add", "-A", "--", ...present);
  if (!git("diff", "--cached", "--name-only")) {
    console.log("devlog: nothing changed, nothing committed");
    return false;
  }
  git("commit", "-m", MESSAGE);
  execFileSync("git", ["push", "origin", "main"], {
    cwd: root,
    stdio: "inherit",
  });
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  publishDevlog({
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  });
