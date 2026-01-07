import type { Command } from "commander";
import { importSalesCommand } from "./import-sales";

export function loadCommands(program: Command): void {
  program.addCommand(importSalesCommand);
}
