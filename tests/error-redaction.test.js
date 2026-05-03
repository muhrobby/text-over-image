const request = require("supertest");

describe("error logging redaction", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    process.env.CORS_ORIGIN = "https://example.com";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.NODE_ENV;
    delete process.env.REQUIRE_AUTH;
    delete process.env.API_TOKEN;
    delete process.env.CORS_ORIGIN;
    jest.resetModules();
  });

  it("redacts sensitive query values from error logs", async () => {
    const app = require("../src/server");

    const response = await request(app)
      .post("/upload?token=dummy-token&api_key=secret-key&password=hunter2")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    const logged = consoleErrorSpy.mock.calls
      .flat()
      .map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry)))
      .join(" ");

    expect(logged).not.toContain("dummy-token");
    expect(logged).not.toContain("secret-key");
    expect(logged).not.toContain("hunter2");
    expect(logged).toContain("[REDACTED]");
  });

  it("does not expose stack traces in production responses", async () => {
    const app = require("../src/server");

    const response = await request(app).get("/missing-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.meta).not.toHaveProperty("stack");
    expect(JSON.stringify(response.body)).not.toContain("Error:");
  });
});
