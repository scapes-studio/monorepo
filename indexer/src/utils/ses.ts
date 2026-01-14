/**
 * Generate an SVG canvas for SES (Scape Entertainment System) visualization.
 * Arranges disk images in a fan pattern around a center point.
 */
export function canvasSVG(images: Buffer[]): string {
  const degrees = 360 / 4 / 8 // 8 is the max merges; 4 is the sides of the disk

  return `
    <svg width="1500" height="1500" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect fill="#F1E9DF" width="1500" height="1500" />

      <g transform="translate(310, 310) rotate(${Math.floor((degrees * (images.length - 1)) / -2)} 445 440)" width="890" height="880">
        ${images
          .map(
            (img, index) => `
            <g transform="rotate(${degrees * index} 445 440)">
              <image width="890" height="880" xlink:href="data:image/png;base64,${img.toString("base64")}" />
            </g>
          `,
          )
          .join("")}
      </g>

      <text
        x="750" y="1440"
        font-size="30px"
        text-anchor="middle"
        fill="#B5AFA7"
        font-family="Space Mono"
        font-weight="bold"
      >[PRESS TO PLAY]</text>
    </svg>
  `
}
