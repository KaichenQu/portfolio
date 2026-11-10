---
type: cheatsheet
tags: [cheatsheet, git]
---
# git troubleshooting cheatsheet

Focused on troubleshooting, not day-to-day commits.

## Authorship and change history
```bash
git log -p <file>              # this file's change history (with diff)
git log -L <start>,<end>:<file># history of just these lines - useful for pinpointing changes
git blame <file>               # who last touched each line, and in which commit
git blame -L 40,60 <file>      # only lines 40-60
git show <commit>              # what a specific commit actually changed
```

## Locating the commit that introduced a regression
```bash
git bisect start <bad> <good>
git bisect run <test-cmd>      # automated bisection, see [[locating-regressions-with-git-bisect]]
git bisect reset
```

## Diffing and searching history
```bash
git diff <a>..<b> -- <path>    # diff for one path between two revisions
git log -S "<string>"          # which commit added/removed this string (pickaxe)
git log -G "<regex>"           # same, but by regex
git log --oneline --graph --all
```

## Recovery and undo
```bash
git reflog                     # recover "lost" commits/branches - the first move after a mistake
git restore --source=<commit> <file>  # restore a file to a specific version
git stash; git stash pop       # shelve changes temporarily to look at something else
git revert <commit>            # safely undo a commit that's already published
```

## Related
- [[locating-regressions-with-git-bisect]]
- [[bisect]]
- [[CL]]
- [[PR]]
