import type { Command } from "commander";
import { importSalesCommand } from "./import-sales";
import { importListingsCommand } from "./import-listings";

export function loadCommands(program: Command): void {
  program.addCommand(importSalesCommand);
  program.addCommand(importListingsCommand);
}
