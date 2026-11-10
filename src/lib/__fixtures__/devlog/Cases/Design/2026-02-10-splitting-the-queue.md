---
type: case-design
date: 2026-02-10
tags: [design, backend]
status: wip
---
# Splitting the queue

Two consumers share one queue, so a slow one blocks the other. Links back to [[2026-01-02-widget-cache-goes-stale]].

![queue](../../Diagrams/2026-02-10-splitting-the-queue.topology.svg)
