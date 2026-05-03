const request = require("supertest");

describe("auth behavior", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    delete process.env.REQUIRE_AUTH;
    delete process.env.API_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("throws when auth is required but API_TOKEN is missing", () => {
    jest.doMock("dotenv", () => ({ config: jest.fn() }));
    process.env.REQUIRE_AUTH = "true";
    delete process.env.API_TOKEN;

    expect(() => require("../src/config/config")).toThrow(
      "API_TOKEN must be set when REQUIRE_AUTH=true"
    );
  });

  it("allows protected routes with a bearer token", async () => {
    process.env.REQUIRE_AUTH = "true";
    process.env.API_TOKEN = "valid-token";

    const app = require("../src/server");

    const response = await request(app)
      .post("/upload")
      .set("Authorization", "Bearer valid-token")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects query token authentication", async () => {
    process.env.REQUIRE_AUTH = "true"
    process.env.API_TOKEN = "valid-token";

    const app = require("../src/server");

    const response = await request(app)
      .post("/upload?token=valid-token")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});