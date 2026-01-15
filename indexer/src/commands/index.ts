import type { Command } from "commander";
import { importSalesCommand } from "./import-sales";
import { importListingsCommand } from "./import-listings";
import { importGallery27Command } from "./import-gallery27";
import { checkRewardsCommand } from "./check-rewards";
import { processMergeImagesCommand } from "./process-merge-images";
import { generateGallery27ImageCommand } from "./generate-gallery27-image";
import { organizeGallery27ImagesCommand } from "./organize-gallery27-images";

export function loadCommands(program: Command): void {
  program.addCommand(importSalesCommand);
  program.addCommand(importListingsCommand);
  program.addCommand(importGallery27Command);
  program.addCommand(checkRewardsCommand);
  program.addCommand(processMergeImagesCommand);
  program.addCommand(generateGallery27ImageCommand);
  program.addCommand(organizeGallery27ImagesCommand);
}
