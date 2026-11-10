#!/usr/bin/env node
// Syncs the vault, then commits and pushes the two mirrored folders to main,
// which Vercel deploys. Both folders are gitignored, so this force-add is the
// only route into the index; nothing else may ride along in that commit.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultSync } from "./sync-devlog.mjs";

export const PATHS = ["content/devlog", "public/blog/diagrams"];
export const MESSAGE = "docs(devlog): sync notes";

const inside = (f) => PATHS.some((p) => f.startsWith(`${p}/`));

/** Returns true when it committed and pushed, false when the sync changed nothing. */
export function publishDevlog({ root, sync = () => defaultSync(root) }) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  const lines = (out) => out.split("\n").filter(Boolean);
  // --no-renames: a file moved in from elsewhere shows its old path too.
  const assertStagedInside = () => {
    const outside = lines(
      git("diff", "--cached", "--name-only", "--no-renames"),
    ).filter((f) => !inside(f));
    if (outside.length)
      throw new Error(
        `Unstage these first, they would ride along in the DevLog commit:\n${outside.join("\n")}`,
      );
  };

  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== "main")
    throw new Error(`devlog:publish runs on main only (current: ${branch})`);
  assertStagedInside();
  git("fetch", "-q", "origin", "main");
  if (git("rev-list", "origin/main..HEAD"))
    throw new Error(
      "main has commits origin/main does not; push or drop them first",
    );

  sync();
  // A pathspec that matches nothing on disk or in the index makes `git add` fail.
  const present = PATHS.filter(
    (p) => fs.existsSync(path.join(root, p)) || git("ls-files", "--", p),
  );
  if (present.length) git("add", "-f", "-A", "--", ...present);
  assertStagedInside();
  if (!git("diff", "--cached", "--name-only")) {
    console.log("devlog: nothing changed, nothing committed");
    return false;
  }
  git("commit", "-q", "-m", MESSAGE);
  // Undo leaves the mirror on disk and the index as it was, so a rerun starts clean.
  const undo = () => git("reset", "-q", "HEAD~1");
  const outside = lines(
    git("diff", "--name-only", "--no-renames", "origin/main", "HEAD"),
  ).filter((f) => !inside(f));
  if (outside.length) {
    undo();
    throw new Error(
      `The DevLog commit would also change:\n${outside.join("\n")}\nNothing was pushed`,
    );
  }
  try {
    git("push", "-q", "origin", "main");
  } catch (e) {
    undo();
    throw new Error(
      `Push rejected; the commit was undone:\n${e.stderr ?? e.message}`,
    );
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    publishDevlog({
      root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    });
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
