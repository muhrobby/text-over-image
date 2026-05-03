const request = require("supertest");

describe("server startup", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
  });

  it("exports the Express app for Supertest usage", () => {
    const app = require("../src/server");

    expect(app).toBeDefined();
    expect(typeof app.use).toBe("function");
  });

  it("still serves health checks through the exported app", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("version");
  });
});
