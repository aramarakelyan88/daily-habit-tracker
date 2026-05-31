import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toDateKey,
  getLastNDays,
  getCurrentWeek,
  calculateCurrentStreak,
  calculateBestStreak,
} from "./dates";

/** Build a YYYY-MM-DD key for `offset` days before the given anchor. */
function keyBefore(anchor: Date, offset: number): string {
  const d = new Date(anchor);
  d.setDate(anchor.getDate() - offset);
  return toDateKey(d);
}

describe("toDateKey", () => {
  it("formats a date as YYYY-MM-DD with zero padding", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("getLastNDays", () => {
  it("returns n days ending today, in ascending order", () => {
    const days = getLastNDays(7);
    expect(days).toHaveLength(7);
    expect(toDateKey(days[6])).toBe(toDateKey(new Date()));
    for (let i = 1; i < days.length; i++) {
      expect(days[i].getTime()).toBeGreaterThan(days[i - 1].getTime());
    }
  });
});

describe("getCurrentWeek", () => {
  it("returns Monday through Sunday (7 days, Monday first)", () => {
    const week = getCurrentWeek();
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(1); // Monday
    expect(week[6].getDay()).toBe(0); // Sunday
  });
});

describe("calculateCurrentStreak", () => {
  const today = new Date(2026, 4, 31); // 2026-05-31

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for no completions", () => {
    expect(calculateCurrentStreak([])).toBe(0);
  });

  it("counts a streak ending today", () => {
    const dates = [keyBefore(today, 0), keyBefore(today, 1), keyBefore(today, 2)];
    expect(calculateCurrentStreak(dates)).toBe(3);
  });

  it("counts a streak ending yesterday (today not yet done)", () => {
    const dates = [keyBefore(today, 1), keyBefore(today, 2)];
    expect(calculateCurrentStreak(dates)).toBe(2);
  });

  it("returns 0 when the most recent completion is older than yesterday", () => {
    const dates = [keyBefore(today, 3), keyBefore(today, 4)];
    expect(calculateCurrentStreak(dates)).toBe(0);
  });

  it("stops at the first gap", () => {
    const dates = [
      keyBefore(today, 0),
      keyBefore(today, 1),
      keyBefore(today, 3), // gap at day 2
    ];
    expect(calculateCurrentStreak(dates)).toBe(2);
  });

  it("is unaffected by unsorted input and duplicate dates", () => {
    const dates = [
      keyBefore(today, 1),
      keyBefore(today, 0),
      keyBefore(today, 0),
      keyBefore(today, 2),
    ];
    expect(calculateCurrentStreak(dates)).toBe(3);
  });
});

describe("calculateBestStreak", () => {
  it("returns 0 for no completions", () => {
    expect(calculateBestStreak([])).toBe(0);
  });

  it("finds the longest consecutive run, not the most recent", () => {
    const dates = [
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04", // run of 4
      "2026-02-01",
      "2026-02-02", // run of 2
    ];
    expect(calculateBestStreak(dates)).toBe(4);
  });

  it("ignores duplicate dates within a run", () => {
    const dates = ["2026-03-01", "2026-03-01", "2026-03-02", "2026-03-03"];
    expect(calculateBestStreak(dates)).toBe(3);
  });

  it("returns 1 when no two days are consecutive", () => {
    const dates = ["2026-01-01", "2026-01-05", "2026-01-10"];
    expect(calculateBestStreak(dates)).toBe(1);
  });
});
