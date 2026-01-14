/**
 * Prompt Generator Service
 *
 * TypeScript port of the Python prompt-generator for TwentySevenYear scape images.
 * Generates AI prompts based on scape attributes and random style selections.
 */

import scapeAttributesData from "../static/scapes-attributes.json";
import descriptionsData from "../data/g27/descriptions.json";
import landmarksData from "../data/g27/landmarks.json";
import layerSortingData from "../data/g27/layer_sorting.json";
import sortingData from "../data/g27/sorting.json";
import promptsData from "../data/g27/prompts.json";
import variationsData from "../data/g27/variations.json";
import variationTypesData from "../data/g27/variation_types.json";

// Types
interface ScapeAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

interface Variation {
  trait_type: string;
  value: string;
  version: number;
}

export interface Attribute {
  trait_type: "Soul" | "Space" | "Time";
  value: string;
}

export interface PromptResult {
  systemPrompt: string;
  userPrompt: string;
  prompt: string;
  attributes: Attribute[];
  initStrength: number;
}

// Data type casts
const scapeAttributes = scapeAttributesData as Record<string, ScapeAttribute[]>;
const descriptions = descriptionsData as Record<string, Record<string, string[]>>;
const landmarks = landmarksData as string[];
const layerSorting = layerSortingData as string[];
const traitSorting = sortingData as string[];
const prompts = promptsData as {
  ARTISTS: Record<string, string>;
  STYLES: Record<string, string>;
  PLATFORMS: Record<string, string>;
};
const variations = variationsData as Record<string, Variation[]>;
const variationTypes = variationTypesData as Record<string, string[]>;

// Landscape offsets for positioning
const landscapeOffsets: Record<string, number[][]> = {
  Beach: [[20], [12, 26]],
  Island: [[0], [-8, 8]],
  Hill: [[20], [16, 26]],
  Lowland: [[0], [-8, 8]],
  Valley: [[18], [16, 26]],
  "": [[0], [-8, 8]],
};

/**
 * Get random float between min and max
 */
function randomFloatBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Get random sample from array
 */
function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Prompt Generator Class
 */
class PromptGenerator {
  private getScapeAttributes(scapeId: number): Record<string, string> {
    const attrs = scapeAttributes[scapeId.toString()] ?? [];
    const result: Record<string, string> = {};
    for (const attr of attrs) {
      if (typeof attr.value === "string") {
        result[attr.trait_type] = attr.value;
      }
    }
    return result;
  }

  private isLandmarkFlipped(scape: Record<string, string>): boolean {
    let firstId = 0;
    for (const t of layerSorting) {
      if (landmarks.includes(t) && t in scape) {
        if (firstId) {
          return firstId > traitSorting.indexOf(t);
        }
        firstId = traitSorting.indexOf(t);
      }
    }
    return false;
  }

  private getLandmarkOffsetsIndex(
    tokenId: number,
    traitType: string,
  ): [number[], number] {
    const scape = this.getScapeAttributes(tokenId);
    const landmarkOffsets: number[] = [];
    let nrLandmarks = 0;

    for (const t of Object.keys(scape)) {
      if (landmarks.includes(t)) {
        nrLandmarks++;
      }
    }
    if (tokenId === 1001) {
      nrLandmarks++;
    }

    if (nrLandmarks) {
      const landscape = scape.Landscape ?? "";
      const offsets = landscapeOffsets[landscape] ?? landscapeOffsets[""];
      const offsetsForCount = offsets?.[nrLandmarks - 1];
      if (offsetsForCount) {
        landmarkOffsets.push(...offsetsForCount);
        if (this.isLandmarkFlipped(scape)) {
          landmarkOffsets.reverse();
        }
      }
    }

    let landmarkIndex = -1;
    for (const t of layerSorting) {
      if (t in scape && landmarks.includes(t)) {
        landmarkIndex++;
        if (t === traitType) {
          break;
        }
      }
    }
    if (tokenId === 1001 && traitType === "Monuments") {
      landmarkIndex++;
    }

    return [landmarkOffsets, landmarkIndex];
  }

  private getTraitValue(
    tokenId: number,
    traitType: string,
    scape: Record<string, string>,
  ): string | null {
    if (["Topology", "Surface"].includes(traitType) || !(traitType in scape)) {
      return null;
    }

    let traitValue: string;
    if (traitType === "Planet") {
      traitValue = `${scape.Topology ?? ""} ${scape.Planet ?? ""}`.trim();
    } else if (traitType === "Landscape") {
      traitValue = `${scape.Surface ?? ""} ${scape.Landscape ?? ""}`.trim();
    } else {
      traitValue = scape[traitType]!;
      if (traitValue in variationTypes) {
        const scapeVariations = variations[tokenId.toString()] ?? [];
        for (const variation of scapeVariations) {
          if (
            variation.trait_type === traitType &&
            variation.value === traitValue
          ) {
            const typeVariants = variationTypes[traitValue]!;
            traitValue = typeVariants[variation.version] ?? traitValue;
            break;
          }
        }
      }
    }
    return traitValue;
  }

  private addLayer(
    tokenId: number,
    traitType: string,
    traitValue: string,
  ): string {
    let value = traitValue;
    const isFlipped = value.endsWith(".flipped");
    if (isFlipped) {
      value = value.slice(0, -8);
    }

    const traitDescriptions = descriptions[traitType]?.[value] ?? [value];
    const output: string[] = [
      traitDescriptions[Math.floor(Math.random() * traitDescriptions.length)]!,
    ];

    if (landmarks.includes(traitType)) {
      const [landmarkOffsets, landmarkIndex] = this.getLandmarkOffsetsIndex(
        tokenId,
        traitType,
      );
      if (landmarkOffsets.length > 0 && landmarkIndex >= 0) {
        const offset = landmarkOffsets[landmarkIndex] ?? 0;
        if (offset < 0) {
          output.push("on the left side of the image");
        } else if (offset > 0) {
          output.push("on the right side of the image");
        } else {
          output.push("in the center");
        }
        if (
          landmarkIndex === 1 &&
          landmarkOffsets.length >= 2 &&
          !((landmarkOffsets[0]! < 0 && landmarkOffsets[1]! > 0) ||
            (landmarkOffsets[0]! > 0 && landmarkOffsets[1]! < 0))
        ) {
          output.push("next to a");
        }
      }
    }
    return output.join(" ");
  }

  private createPrompt(
    tokenId: number,
    includeStyles: boolean = true,
  ): string {
    const scape = this.getScapeAttributes(tokenId);
    const layerDescriptions: Record<string, string> = {};

    for (const traitType of layerSorting) {
      const traitValue = this.getTraitValue(tokenId, traitType, scape);
      if (traitValue === null) continue;

      layerDescriptions[traitType] = this.addLayer(
        tokenId,
        traitType,
        traitValue,
      );

      if (tokenId === 1001 && traitType === "Monuments") {
        layerDescriptions[traitType] = this.addLayer(tokenId, traitType, "Skull");
      }
    }

    // Build prompt from layer descriptions
    const output: string[] = [];
    let landmarkCounter = 0;

    for (const traitType of [...layerSorting].reverse()) {
      if (!(traitType in layerDescriptions)) continue;

      if (landmarks.includes(traitType)) {
        landmarkCounter++;
      }

      if (traitType === "Landscape") {
        if (landmarkCounter) {
          output.push("standing on");
        }
        output.push("a");
      }
      if (traitType === "Fluid") {
        output.push(", there is a");
      }
      if (traitType === "Planet") {
        output.push("and in the background you can see a");
      }
      if (traitType === "Celestial") {
        if (landmarkCounter) {
          output.push(", in the");
        }
        if ("Sky" in layerDescriptions) {
          output.push(
            `${layerDescriptions.Atmosphere ?? ""}, ${layerDescriptions.Sky ?? ""} and ${layerDescriptions.Celestial ?? ""} are visible`,
          );
        } else {
          output.push(
            `${layerDescriptions.Atmosphere ?? ""}, ${layerDescriptions.Celestial ?? ""} is visible`,
          );
        }
        break;
      }
      if (traitType === "Sky") {
        output.push(
          `, in the ${layerDescriptions.Atmosphere ?? ""} ${layerDescriptions.Sky ?? ""} are visible`,
        );
        break;
      }
      if (traitType === "Atmosphere") {
        output.push("there is a");
      }
      output.push(layerDescriptions[traitType]!);
    }

    if (!includeStyles) {
      return output.join(" ");
    }

    // Add artist, style, platform
    const artistKeys = Object.keys(prompts.ARTISTS);
    const styleKeys = Object.keys(prompts.STYLES);
    const platformKeys = Object.keys(prompts.PLATFORMS);

    const artistCount = Math.random() < 0.8 ? 1 : 2;
    const artists = randomSample(artistKeys, artistCount);
    const styles = randomSample(styleKeys, Math.floor(Math.random() * 3) + 1);
    const platforms = randomSample(
      platformKeys,
      Math.floor(Math.random() * 2),
    );

    let prompt = `a painting showing a ${output.join(" ")}, painted by ${artists.join(" and ")}, ${styles.join(" ")}`;
    if (platforms.length > 0) {
      prompt += `, ${platforms.join(" ")}`;
    }

    return prompt;
  }

  /**
   * Find 27YS attributes (Soul/Space/Time) from prompt
   */
  private find27YSAttributes(
    kind: "ARTISTS" | "STYLES" | "PLATFORMS",
    prompt: string,
  ): string[] {
    const mapping = prompts[kind];
    const found: string[] = [];
    for (const [key, value] of Object.entries(mapping)) {
      if (prompt.toLowerCase().includes(key.toLowerCase())) {
        found.push(value);
      }
    }
    return found;
  }

  /**
   * Generate a prompt for a scape
   */
  generate(scapeId: number, message: string = ""): PromptResult {
    const systemPrompt = this.createPrompt(scapeId, true);

    // Extract attributes
    const artists = this.find27YSAttributes("ARTISTS", systemPrompt);
    const styles = this.find27YSAttributes("STYLES", systemPrompt);
    const platforms = this.find27YSAttributes("PLATFORMS", systemPrompt);

    const attributes: Attribute[] = [
      ...artists.map((a) => ({ trait_type: "Soul" as const, value: a })),
      ...styles.map((a) => ({ trait_type: "Space" as const, value: a })),
      ...platforms.map((a) => ({ trait_type: "Time" as const, value: a })),
    ].filter((item, index, arr) => {
      const values = arr.map((a) => a.value);
      return item.value && !values.includes(item.value, index + 1);
    });

    // Clean user message (allow only safe characters)
    const cleanMessage =
      message.match(/[a-z\d\-_,!\r\n\s]/gi)?.join("") || "";

    // Combine prompts
    const prompt = cleanMessage
      ? `${systemPrompt} | ${cleanMessage}`
      : systemPrompt;

    // Random init strength
    const initStrength =
      Math.random() > 0.6
        ? randomFloatBetween(0.1, 0.28)
        : randomFloatBetween(0.1, 0.35);

    return {
      systemPrompt,
      userPrompt: cleanMessage,
      prompt,
      attributes,
      initStrength,
    };
  }
}

// Export singleton instance
export const promptGenerator = new PromptGenerator();

/**
 * Generate a prompt for a scape (convenience function)
 */
export function generatePrompt(
  scapeId: number,
  message: string = "",
): PromptResult {
  return promptGenerator.generate(scapeId, message);
}
