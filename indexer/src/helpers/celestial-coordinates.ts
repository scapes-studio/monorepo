/**
 * Generate random celestial coordinates for NFT attributes.
 * These create unique pseudo-astronomical coordinates for each minted piece.
 */

export function generateCelestialLatitude(): number {
  return Math.round((Math.random() * 180 - 90) * 10000) / 10000;
}

export function generateCelestialLongitude(): number {
  return Math.round(Math.random() * 360 * 10000) / 10000;
}

export function generateDistance(): number {
  return Math.round(Math.random() * 20 * 10000) / 10000;
}
