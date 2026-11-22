import sharp from "sharp";
import { expect, it } from "vitest";
import { cutOutPaper } from "./cover-cutout";

it("removes white ground and enclosed white while preserving the saturated shape", async () => {
  const side = 9;
  const color = [215, 32, 75];
  const input = Buffer.alloc(side * side * 3, 255);
  for (let y = 1; y < side - 1; y++) {
    for (let x = 1; x < side - 1; x++) {
      if (x >= 3 && x <= 5 && y >= 3 && y <= 5) continue;
      input.set(color, (y * side + x) * 3);
    }
  }
  const source = await sharp(input, {
    raw: { width: side, height: side, channels: 3 },
  }).png().toBuffer();
  const { data, info } = await sharp(await cutOutPaper(source))
    .raw().toBuffer({ resolveWithObject: true });
  expect(info.channels).toBe(4);
  const pixel = (x: number, y: number) => {
    const column = Math.floor((x + .5) * info.width / side);
    const row = Math.floor((y + .5) * info.height / side);
    const offset = (row * info.width + column) * info.channels;
    return Array.from(data.subarray(offset, offset + info.channels));
  };

  expect(pixel(0, 0)[3]).toBe(0);
  expect(pixel(4, 4)[3]).toBe(0);
  const saturated = pixel(2, 4);
  expect(saturated[3]).toBe(255);
  // WebP colour is lossy; sample the interior of the shape.
  color.forEach((channel, i) => expect(Math.abs(channel - saturated[i])).toBeLessThanOrEqual(3));
});
