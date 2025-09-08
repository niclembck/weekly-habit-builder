import { describe, it, expect } from "vitest";
import { startOfWeekMonday } from "../utils/dates";

describe("Week start normalization contract", () => {
  it("normalizes any picked date to its Monday (local) at 00:00", () => {
    const picked = new Date("2025-09-07T17:00:00"); // a Sunday
    const normalized = startOfWeekMonday(picked);

    // Still September (0-based month = 8), date is 1, and local midnight
    expect(normalized.getMonth()).toBe(8);
    expect(normalized.getDate()).toBe(1);
    expect(normalized.getDay()).toBe(1); // Monday local
    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
    expect(normalized.getMilliseconds()).toBe(0);
  });
});
