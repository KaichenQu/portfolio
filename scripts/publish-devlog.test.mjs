// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { publishDevlog } from "./publish-devlog.mjs";

let tmp, root, remote;
const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
const write = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};
const writeNote = () => write("content/devlog/Techniques/a.md", "# A\n");
const head = () => git(root, "rev-parse", "HEAD");

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-publish-"));
  root = path.join(tmp, "repo");
  remote = path.join(tmp, "remote.git");
  fs.mkdirSync(path.join(tmp, "hooks"));
  fs.mkdirSync(path.join(tmp, "remote-hooks"));
  git(tmp, "init", "-q", "--bare", "-b", "main", remote);
  git(remote, "config", "core.hooksPath", path.join(tmp, "remote-hooks"));
  git(tmp, "init", "-q", "-b", "main", root);
  for (const [k, v] of [
    ["user.name", "Test"],
    ["user.email", "test@example.com"],
    ["commit.gpgsign", "false"],
    ["core.hooksPath", path.join(tmp, "hooks")],
  ])
    git(root, "config", k, v);
  // The real repo ignores both mirror folders; publish must force-add them.
  write(".gitignore", "/content/devlog/\n/public/blog/diagrams/\n");
  write("README.md", "readme\n");
  git(root, "add", ".gitignore", "README.md");
  git(root, "commit", "-q", "-m", "chore(repo): init");
  git(root, "remote", "add", "origin", remote);
  git(root, "push", "-q", "origin", "main");
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("publishDevlog", () => {
  it("refuses off main without syncing", () => {
    git(root, "checkout", "-q", "-b", "feat/x");
    const sync = vi.fn();

    expect(() => publishDevlog({ root, sync })).toThrow(/main only/);
    expect(sync).not.toHaveBeenCalled();
  });

  it("refuses when something outside the two folders is staged", () => {
    write("README.md", "changed\n");
    git(root, "add", "README.md");
    const sync = vi.fn();

    expect(() => publishDevlog({ root, sync })).toThrow(/README\.md/);
    expect(sync).not.toHaveBeenCalled();
  });

  it("refuses a staged rename into the folders, which hides the old path", () => {
    fs.mkdirSync(path.join(root, "content/devlog"), { recursive: true });
    fs.renameSync(path.join(root, "README.md"), path.join(root, "content/devlog/README.md"));
    git(root, "add", "-f", "-A", "README.md", "content/devlog/README.md");
    // With rename detection, only the new path inside the folder shows.
    expect(git(root, "diff", "--cached", "--name-only")).toBe("content/devlog/README.md");
    const sync = vi.fn();

    expect(() => publishDevlog({ root, sync })).toThrow(/README\.md/);
    expect(sync).not.toHaveBeenCalled();
  });

  it("refuses when main has a commit origin/main does not", () => {
    write("README.md", "local\n");
    git(root, "commit", "-q", "-am", "chore(repo): local only");
    const sync = vi.fn();

    expect(() => publishDevlog({ root, sync })).toThrow(
      /origin\/main does not/,
    );
    expect(sync).not.toHaveBeenCalled();
  });

  it("commits nothing when the sync throws", () => {
    const before = head();
    const sync = () => {
      writeNote();
      throw new Error("sync failed");
    };

    expect(() => publishDevlog({ root, sync })).toThrow("sync failed");
    expect(head()).toBe(before);
    expect(git(root, "diff", "--cached", "--name-only")).toBe("");
  });

  it("refuses when the sync stages something outside the folders", () => {
    const before = head();
    const sync = () => {
      writeNote();
      write("stray.txt", "x\n");
      git(root, "add", "stray.txt");
    };

    expect(() => publishDevlog({ root, sync })).toThrow(/stray\.txt/);
    expect(head()).toBe(before);
  });

  it("exits without a commit when the sync changed nothing", () => {
    writeNote();
    git(root, "add", "-f", "content");
    git(root, "commit", "-q", "-m", "docs(devlog): seed");
    git(root, "push", "-q", "origin", "main");
    const before = head();

    expect(publishDevlog({ root, sync: writeNote })).toBe(false);
    expect(head()).toBe(before);
  });

  it("force-adds only the two ignored folders, commits with a bare message and pushes main", () => {
    write("README.md", "unstaged edit\n");
    const sync = () => {
      writeNote();
      write("public/blog/diagrams/a.svg", "<svg/>");
    };

    expect(publishDevlog({ root, sync })).toBe(true);

    expect(git(root, "log", "-1", "--format=%B")).toBe(
      "docs(devlog): sync notes",
    );
    expect(
      git(root, "show", "--name-only", "--format=", "HEAD").split("\n"),
    ).toEqual(["content/devlog/Techniques/a.md", "public/blog/diagrams/a.svg"]);
    expect(git(remote, "rev-parse", "main")).toBe(head());
    expect(git(root, "status", "--porcelain")).toBe("M README.md");
  });

  it("undoes the commit when the push is rejected, so the next run succeeds", () => {
    const hook = path.join(tmp, "remote-hooks", "pre-receive");
    fs.writeFileSync(hook, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    const before = head();

    expect(() => publishDevlog({ root, sync: writeNote })).toThrow(
      /Push rejected/,
    );
    expect(head()).toBe(before);
    expect(git(root, "diff", "--cached", "--name-only")).toBe("");

    fs.rmSync(hook);
    expect(publishDevlog({ root, sync: writeNote })).toBe(true);
    expect(git(remote, "rev-parse", "main")).toBe(head());
  });
});
