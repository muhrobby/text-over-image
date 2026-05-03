const request = require("supertest");
const { version } = require("../package.json");

describe("documentation routes", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
  });

  it("serves the JSON API documentation route", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/api");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("title");
    expect(response.body.version).toBe(version);
  });

  it("serves Swagger UI metadata route", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/api-docs");

    expect([200, 301, 302]).toContain(response.status);
  });

  it("documents static token auth and public docs consistently", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/api");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: expect.any(String),
      version,
      endpoints: expect.objectContaining({
        "GET /health": expect.any(Object),
        "GET /api-docs": expect.objectContaining({
          authentication: "No authentication required",
        }),
      }),
    });
    expect(JSON.stringify(response.body)).toContain("/api-docs");
  });
});
