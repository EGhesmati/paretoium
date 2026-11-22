import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "./auth";

describe("auth utilities", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("super-secret-123");
    expect(verifyPassword("super-secret-123", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("signs and verifies session tokens", () => {
    const token = createSessionToken({
      id: "user_1",
      email: "ada@example.com",
      name: "Ada",
    });
    expect(verifySessionToken(token)).toEqual({
      id: "user_1",
      email: "ada@example.com",
      name: "Ada",
    });
    expect(verifySessionToken(`${token}tampered`)).toBeNull();
  });
});
