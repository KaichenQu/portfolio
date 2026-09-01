"use client";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useEffect, useState } from "react";

export function Clock({ timeZone }: { timeZone?: string } = {}) {
  const [time, setTime] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(new Date());
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
      setTime({ h: get("hour") % 24, m: get("minute"), s: get("second") });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  if (!time) return <span className="font-mono opacity-0">00:00:00</span>;

  return (
    <span className="inline-flex items-center gap-0.5 font-mono">
      <SlidingNumber value={time.h} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={time.m} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={time.s} padStart={true} />
    </span>
  );
}
