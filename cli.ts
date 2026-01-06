import "dotenv/config";
import { Command } from "commander";
import { loadCommands } from "./src/commands/index";

const program = new Command()
  .name("scapes-cli")
  .description("Scapes Indexer CLI - Import and manage OpenSea sales data")
  .version("1.0.0");

loadCommands(program);

program.parse();
