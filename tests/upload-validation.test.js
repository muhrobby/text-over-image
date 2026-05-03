const request = require("supertest");
const sharp = require("sharp");

describe("upload validation", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
  });

  it("rejects uploads when no file is provided", async () => {
    const app = require("../src/server");

    const response = await request(app).post("/upload").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects invalid image URLs before fetch", async () => {
    const app = require("../src/server");

    const response = await request(app)
      .post("/upload-url")
      .send({ url: "not-a-url" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects image exceeding pixel limit", async () => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";

    const app = require("../src/server");

    const hugeBuffer = await sharp({
      create: {
        width: 15000,
        height: 15000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const response = await request(app)
      .post("/upload")
      .attach("image", hugeBuffer, {
        filename: "huge.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("too large");
    expect(response.body.message).toContain("megapixels");
  });
});
