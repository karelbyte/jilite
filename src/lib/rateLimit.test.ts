import { describe, expect, it } from "vitest";
import { checkRateLimit, secondsUntil } from "./rateLimit";

describe("checkRateLimit", () => {
  it("permite hasta el límite", () => {
    const key = `t1_${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { limit: 3 }).allowed).toBe(true);
    }
    expect(checkRateLimit(key, { limit: 3 }).allowed).toBe(false);
  });

  it("olvide keys distintas de forma independiente", () => {
    const a = `a_${Date.now()}`;
    const n: string[] = [];
    for (let i = 0; i < 2; i++) {
      expect(checkRateLimit(a, { limit: 2 }).allowed).toBe(true);
      const other = checkRateLimit(`${a}_other`, { limit: 10 });
      n.push(String(other.allowed));
    }
    expect(n.every((v) => v === "true")).toBe(true);
  });
});

describe("secondsUntil", () => {
  it("redondea hacia arriba", () => {
    expect(secondsUntil(1500)).toBe(2);
    expect(secondsUntil(undefined)).toBe(0);
  });
});