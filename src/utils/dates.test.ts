import { describe, it, expect } from "vitest";
import {
  toValidDate,
  startOfWeekMonday,
  addDays,
  startOfMonth,
  endOfMonth,
} from "./dates";

describe("dates utils", () => {
  it("toValidDate: passes through valid Date (new copy) and coerces strings", () => {
    const orig = new Date("2025-09-07T12:34:00");
    const a = toValidDate(orig);
    const b = toValidDate("2025-09-07");

    expect(a instanceof Date).toBe(true);
    expect(b instanceof Date).toBe(true);

    // New copy (different object), same timestamp
    expect(a).not.toBe(orig);
    expect(a.getTime()).toBe(orig.getTime());

    // Invalid inputs fall back to a valid Date (not NaN)
    expect(isNaN(toValidDate("not-a-date").getTime())).toBe(false);
  });

  it("startOfWeekMonday: normalizes any day to Monday 00:00 local without mutating input", () => {
    const sun = new Date("2025-09-07T17:00:00"); // Sunday
    const snap = sun.getTime();
    const mon = startOfWeekMonday(sun);

    // Monday (local)
    expect(mon.getDay()).toBe(1);
    // Local midnight
    expect(mon.getHours()).toBe(0);
    expect(mon.getMinutes()).toBe(0);
    expect(mon.getSeconds()).toBe(0);
    expect(mon.getMilliseconds()).toBe(0);
    // Input not mutated
    expect(sun.getTime()).toBe(snap);
  });

  it("addDays: returns a new Date shifted by n days", () => {
    const d = new Date("2025-09-01T10:00:00");
    const d2 = addDays(d, 3);
    expect(d2.getDate()).toBe(4);
    expect(d.getDate()).toBe(1); // original not mutated
  });

  it("startOfMonth / endOfMonth: correct boundaries (local), no mutation", () => {
    const d = new Date("2025-02-15T08:00:00");
    const s = startOfMonth(d);
    const e = endOfMonth(d);

    // Start at the 1st, local midnight
    expect(s.getDate()).toBe(1);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getSeconds()).toBe(0);
    expect(s.getMilliseconds()).toBe(0);

    // Feb 2025 = 28 days
    expect(e.getDate()).toBe(28);
    expect(e.getHours()).toBe(0);
    expect(e.getMinutes()).toBe(0);
    expect(e.getSeconds()).toBe(0);
    expect(e.getMilliseconds()).toBe(0);

    // Input not mutated
    expect(d.getUTCDate()).toBe(15);
  });

  it('startOfWeekMonday handles Sundays and keeps midnight local time', () => {
    const sun = new Date('2025-09-07T12:34:56') // Sun
    const mon = startOfWeekMonday(sun)
    // Monday
    expect(mon.getDay()).toBe(1)
    // local midnight
    expect(mon.getHours()).toBe(0)
    expect(mon.getMinutes()).toBe(0)
  })

  it('startOfMonth/endOfMonth do not mutate original', () => {
    const d = new Date('2025-02-15T10:00:00')
    const s = startOfMonth(d)
    const e = endOfMonth(d)
    expect(s.getDate()).toBe(1)
    expect(e.getDate()).toBe(28) // 2025-02 has 28 days
    expect(d.getDate()).toBe(15)
  })

  it('addDays creates a new Date and offsets correctly', () => {
    const d = new Date('2025-01-01T00:00:00')
    const d2 = addDays(d, 10)
    expect(d2.getDate()).toBe(11)
    expect(+d2).not.toBe(+d)
  })

  it('toValidDate falls back to now for bad input', () => {
    const bad = toValidDate('not-a-date')
    expect(bad instanceof Date).toBe(true)
  })
});
