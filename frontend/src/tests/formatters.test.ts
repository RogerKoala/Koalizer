import { describe, it, expect } from "vitest";
import {
 countWords,
 formatSecondsToHMS,
 formatTime,
 parseTimeToSeconds,
} from "../utils/formatters";

// ========================================
// countWords
// ========================================
describe("countWords", () => {
 it("returns 0 for empty string", () => {
  expect(countWords("")).toBe(0);
 });

 it("returns 0 for null/undefined", () => {
  expect(countWords(null as any)).toBe(0);
  expect(countWords(undefined as any)).toBe(0);
 });

 it("counts a single word", () => {
  expect(countWords("hello")).toBe(1);
 });

 it("counts multiple words", () => {
  expect(countWords("hello world foo")).toBe(3);
 });

 it("ignores extra spaces and tabs", () => {
  expect(countWords("  hello   world  ")).toBe(2);
  expect(countWords("\thello\t\tworld\t")).toBe(2);
 });

 it("handles whitespace-only strings", () => {
  expect(countWords("   ")).toBe(0);
 });

 it("counts words with accents", () => {
  expect(countWords("olá mundo café")).toBe(3);
 });
});

// ========================================
// formatSecondsToHMS
// ========================================
describe("formatSecondsToHMS", () => {
 it("formats 0 seconds", () => {
  expect(formatSecondsToHMS(0)).toBe("00:00:00");
 });

 it("formats seconds less than 1 minute", () => {
  expect(formatSecondsToHMS(45)).toBe("00:00:45");
 });

 it("formats exactly 1 minute", () => {
  expect(formatSecondsToHMS(60)).toBe("00:01:00");
 });

 it("formats 61 seconds", () => {
  expect(formatSecondsToHMS(61)).toBe("00:01:01");
 });

 it("formats exactly 1 hour", () => {
  expect(formatSecondsToHMS(3600)).toBe("01:00:00");
 });

 it("formats 1h 1m 1s", () => {
  expect(formatSecondsToHMS(3661)).toBe("01:01:01");
 });

 it("truncates decimal values", () => {
  expect(formatSecondsToHMS(61.999)).toBe("00:01:01");
 });

 it("formats large values (over 24h)", () => {
  expect(formatSecondsToHMS(90061)).toBe("25:01:01");
 });
});

// ========================================
// formatTime
// ========================================
describe("formatTime", () => {
 it("formats 0 seconds", () => {
  expect(formatTime(0)).toBe("00:00:00");
 });

 it("formats 5400 seconds (1h30m)", () => {
  expect(formatTime(5400)).toBe("01:30:00");
 });

 it("truncates decimal values", () => {
  expect(formatTime(3661.75)).toBe("01:01:01");
 });

 it("returns the same result as formatSecondsToHMS", () => {
  const testValues = [0, 1, 59, 60, 61, 3600, 3661, 86400];
  testValues.forEach((v) => {
   expect(formatTime(v)).toBe(formatSecondsToHMS(v));
  });
 });
});

// ========================================
// parseTimeToSeconds
// ========================================
describe("parseTimeToSeconds", () => {
 it("parses 00:00:00 to 0", () => {
  expect(parseTimeToSeconds("00:00:00")).toBe(0);
 });

 it("parses 00:01:01 to 61", () => {
  expect(parseTimeToSeconds("00:01:01")).toBe(61);
 });

 it("parses 01:30:45 to 5445", () => {
  expect(parseTimeToSeconds("01:30:45")).toBe(5445);
 });

 it("parses large hour values", () => {
  expect(parseTimeToSeconds("25:01:01")).toBe(90061);
 });

 it("returns 0 for invalid format (less than 3 parts)", () => {
  expect(parseTimeToSeconds("01:30")).toBe(0);
  expect(parseTimeToSeconds("45")).toBe(0);
 });

 it("returns 0 for empty string", () => {
  expect(parseTimeToSeconds("")).toBe(0);
 });

 it("is the inverse of formatTime", () => {
  const testValues = [0, 61, 3661, 5445, 86400];
  testValues.forEach((v) => {
   expect(parseTimeToSeconds(formatTime(v))).toBe(v);
  });
 });
});
