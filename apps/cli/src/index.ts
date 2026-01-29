#!/usr/bin/env bun

import { createProgram } from "./cli";
import { printError } from "./output";

const program = createProgram();

program.parseAsync(process.argv).catch((error) => {
  printError(error);
  process.exitCode = 1;
});
