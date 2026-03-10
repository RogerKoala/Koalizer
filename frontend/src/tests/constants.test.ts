import { describe, it, expect } from "vitest";
import { APP_VERSION, PROJECT_FORMAT_VERSION } from "../constants";

describe("constants", () => {
 describe("APP_VERSION", () => {
  it("is a non-empty string", () => {
   expect(typeof APP_VERSION).toBe("string");
   expect(APP_VERSION.length).toBeGreaterThan(0);
  });

  it("follows semver format (X.Y.Z)", () => {
   expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
 });

 describe("PROJECT_FORMAT_VERSION", () => {
  it("is a non-empty string", () => {
   expect(typeof PROJECT_FORMAT_VERSION).toBe("string");
   expect(PROJECT_FORMAT_VERSION.length).toBeGreaterThan(0);
  });

  it("follows semver format (X.Y.Z)", () => {
   expect(PROJECT_FORMAT_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
 });
});
