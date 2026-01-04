import sharp from 'sharp'
import quantize from 'quantize'

/**
 * Extract dominant colors from an image buffer using MMCQ algorithm
 * Based on Color Thief's pixel filtering logic
 * @param buffer - Image buffer
 * @param count - Number of colors to extract (default: 5)
 * @param quality - Sampling quality, 1 = every pixel, 10 = every 10th pixel (default: 10)
 * @returns Array of hex color strings
 */
export async function extractDominantColors(
  buffer: Buffer,
  count: number = 5,
  quality: number = 10
): Promise<string[]> {
  try {
    // Keep alpha channel for transparency filtering
    const { data, info } = await sharp(buffer)
      .resize(200, 200, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixelCount = info.width * info.height
    const pixels: [number, number, number][] = []

    // Color Thief style pixel filtering
    for (let i = 0; i < pixelCount; i += quality) {
      const offset = i * 4
      const r = data[offset]
      const g = data[offset + 1]
      const b = data[offset + 2]
      const a = data[offset + 3]

      // Skip transparent/semi-transparent pixels (alpha < 125)
      if (a < 125) continue

      // Skip near-white pixels
      if (r > 250 && g > 250 && b > 250) continue

      pixels.push([r, g, b])
    }

    if (pixels.length === 0) return []

    const colorMap = quantize(pixels, count)
    if (!colorMap) return []

    return colorMap.palette().map(([r, g, b]) =>
      `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    )
  } catch (error) {
    console.error('Failed to extract dominant colors:', error)
    return []
  }
}
