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

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlog-publish-"));
  root = path.join(tmp, "repo");
  remote = path.join(tmp, "remote.git");
  fs.mkdirSync(path.join(tmp, "hooks"));
  git(tmp, "init", "--bare", "-b", "main", remote);
  git(tmp, "init", "-b", "main", root);
  for (const [k, v] of [
    ["user.name", "Test"],
    ["user.email", "test@example.com"],
    ["commit.gpgsign", "false"],
    ["core.hooksPath", path.join(tmp, "hooks")],
  ])
    git(root, "config", k, v);
  write("README.md", "readme\n");
  git(root, "add", "README.md");
  git(root, "commit", "-m", "chore(repo): init");
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

  it("exits without a commit when the sync changed nothing", () => {
    writeNote();
    git(root, "add", "content");
    git(root, "commit", "-m", "docs(devlog): seed");
    const head = git(root, "rev-parse", "HEAD");

    expect(publishDevlog({ root, sync: writeNote })).toBe(false);
    expect(git(root, "rev-parse", "HEAD")).toBe(head);
  });

  it("commits only the two folders with a bare message and pushes main", () => {
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
    expect(git(remote, "rev-parse", "main")).toBe(
      git(root, "rev-parse", "HEAD"),
    );
    expect(git(root, "status", "--porcelain")).toBe("M README.md");
  });
});
