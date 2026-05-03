const request = require("supertest");

describe("production config hardening", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.REQUIRE_AUTH;
    delete process.env.API_TOKEN;
    delete process.env.CORS_ORIGIN;
    delete process.env.TRUST_PROXY;
    delete process.env.ALLOW_WILDCARD_CORS;
    delete process.env.ALLOW_HTTP_IMAGES;
    jest.resetModules();
  });

  it("rejects wildcard CORS in production unless explicitly allowed", () => {
    jest.doMock("dotenv", () => ({ config: jest.fn() }));
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    process.env.CORS_ORIGIN = "*";

    expect(() => require("../src/config/config")).toThrow(
      "CORS_ORIGIN=* in production requires ALLOW_WILDCARD_CORS=true"
    );
  });

  it("allows wildcard CORS in production when explicitly enabled", () => {
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    process.env.CORS_ORIGIN = "*";
    process.env.ALLOW_WILDCARD_CORS = "true";

    const config = require("../src/config/config");

    expect(config.cors.origin).toBe("*");
    expect(config.security.allowWildcardCors).toBe(true);
  });

  it("defaults trust proxy to one trusted proxy for Dokploy", () => {
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";

    const config = require("../src/config/config");

    expect(config.trustProxy).toBe(1);
  });

  it("defaults to bundled watermark fonts for cloud runtimes", () => {
    jest.doMock("dotenv", () => ({ config: jest.fn() }));
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    delete process.env.WATERMARK_FONT_REGULAR;
    delete process.env.WATERMARK_FONT_SEMIBOLD;

    const config = require("../src/config/config");

    expect(config.watermark.fontRegular).toBe("public/fonts/Inter-Regular.ttf");
    expect(config.watermark.fontSemibold).toBe("public/fonts/Inter-SemiBold.ttf");
  });

  it("removes http image sources from CSP in production by default", async () => {
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    process.env.CORS_ORIGIN = "https://example.com";
    process.env.ALLOW_HTTP_IMAGES = "false";

    const app = require("../src/server");
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).not.toContain(
      "http:"
    );
  });

  it("allows http image sources only when explicitly enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    process.env.CORS_ORIGIN = "https://example.com";
    process.env.ALLOW_HTTP_IMAGES = "true";

    const app = require("../src/server");
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain("http:");
  });
});
