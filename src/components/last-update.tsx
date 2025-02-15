"use client";

import { useEffect, useState } from "react";

export function LastUpdate() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/last-update")
      .then((res) => res.json())
      .then((data) => {
        setLastUpdate(new Date(data.lastUpdate));
      })
      .catch(() => {
        setLastUpdate(new Date());
      });
  }, []);

  if (!lastUpdate) return null;

  return (
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Last updated: {lastUpdate.toLocaleDateString("zh-CN")}
    </p>
  );
}
