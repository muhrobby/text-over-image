const mockPipeline = {
  jpeg: jest.fn(() => mockPipeline),
  png: jest.fn(() => mockPipeline),
  webp: jest.fn(() => mockPipeline),
  toBuffer: jest.fn(async () => Buffer.from("processed-image")),
};

const mockImage = {
  metadata: jest.fn(async () => ({ width: 1200, height: 800, format: "jpeg" })),
  composite: jest.fn(() => mockPipeline),
};

jest.mock("sharp", () => jest.fn(() => mockImage));

describe("watermark font rendering", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.REQUIRE_AUTH = "false";
    process.env.API_TOKEN = "test-token";
    delete process.env.WATERMARK_FONT_REGULAR;
    delete process.env.WATERMARK_FONT_SEMIBOLD;
  });

  it("renders watermark text through Sharp fontfile instead of SVG font fallback", async () => {
    const imageService = require("../src/services/imageService");

    await imageService.addWatermark(Buffer.from("image"), "Jakarta, Indonesia");

    const overlays = mockImage.composite.mock.calls[0][0];

    expect(overlays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          input: expect.objectContaining({
            text: expect.objectContaining({
              fontfile: expect.stringContaining("public/fonts/"),
            }),
          }),
        }),
      ])
    );
  });

  it("renders visible white text with black stroke near the bottom-left", async () => {
    const imageService = require("../src/services/imageService");

    await imageService.addWatermark(Buffer.from("image"), "Jakarta, Indonesia");

    const overlays = mockImage.composite.mock.calls[0][0];
    const textOverlays = overlays.filter((overlay) => overlay.input.text);

    expect(textOverlays.length).toBeGreaterThanOrEqual(4);
    expect(textOverlays[0].input.text.text).toContain("foreground=\"#000000\"");
    expect(textOverlays[8].input.text.text).toContain("foreground=\"#FFFFFF\"");
    expect(textOverlays[8].input.text.align).toBe("left");
    expect(textOverlays[8].left).toBeLessThanOrEqual(40);
    expect(textOverlays[8].top).toBeGreaterThanOrEqual(600);
  });
});
