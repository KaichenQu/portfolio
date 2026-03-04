"use client";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime({ h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <span className="font-mono opacity-0">00:00:00</span>;

  return (
    <div className="flex items-center gap-0.5 font-mono">
      <SlidingNumber value={time.h} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={time.m} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={time.s} padStart={true} />
    </div>
  );
}
