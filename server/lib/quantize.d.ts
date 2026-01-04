declare module 'quantize' {
  type RGB = [number, number, number]
  interface ColorMap {
    palette(): RGB[]
  }
  function quantize(pixels: RGB[], maxColors: number): ColorMap | null
  export = quantize
}