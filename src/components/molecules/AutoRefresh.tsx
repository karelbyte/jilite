"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  intervalMs?: number;
}

export default function AutoRefresh({ children, intervalMs = 10000 }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!visible) return;
    timer.current = setInterval(() => router.refresh(), intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [visible, intervalMs, router]);

  return <>{children}</>;
}