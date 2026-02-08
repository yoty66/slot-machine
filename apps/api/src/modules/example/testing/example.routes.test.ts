import { describe, test, expect } from "vitest";
import app from "../../../index";

describe("Example module routes", () => {
  test("GET /api/example returns 200 and expected response body", async () => {
    const res = await app.request("/api/example");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const body = await res.json();
    expect(body).toEqual({
      message: "Hello from getExample",
    });
  });
});
