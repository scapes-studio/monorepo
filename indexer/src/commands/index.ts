import type { Command } from "commander";
import { importSalesCommand } from "./import-sales";
import { importListingsCommand } from "./import-listings";
import { import27yCommand } from "./import-27y";

export function loadCommands(program: Command): void {
  program.addCommand(importSalesCommand);
  program.addCommand(importListingsCommand);
  program.addCommand(import27yCommand);
}
