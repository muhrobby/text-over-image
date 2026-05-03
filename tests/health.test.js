const request = require("supertest");

describe("GET /health", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
  });

  it("returns health status and version", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("version");
  });
});
