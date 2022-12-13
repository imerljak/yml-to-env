import arg from "arg";
import inquirer from "inquirer";
import { parseYaml } from "./parser";

function parseArguments(rawArgs) {
  const args = arg(
    {
      "--toFile": Boolean,
      "-f": "--toFile",
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    printOnly: args["--toFile"] || false,
    filePath: args._[0],
  };
}

function excludePaths(nodePath) {
  return nodePath.startsWith("node_modules") || nodePath.startsWith(".git");
}

async function promptForMissingOptions(options) {
  const questions = [];

  if (!options.filePath) {
    inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
    questions.push({
      type: "fuzzypath",
      itemType: "file",
      suggestOnly: false,
      excludePath: excludePaths,
      excludeFilter: (nodePath) => nodePath == ".",
      name: "filePath",
      message: "Please inform the yaml file path you desire to parse:",
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    filePath: options.filePath || answers.filePath,
  };
}

export async function cli(args) {
  try {
    let options = parseArguments(args);
    options = await promptForMissingOptions(options);
    parseYaml(options);
  } catch (error) {
    console.error(`Exited with error: ${error.message}`);
  }
}
