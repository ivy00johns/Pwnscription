#!/usr/bin/env node

import fs from "fs";
import CLI from "clui";
import path from "path";
import chalk from "chalk";
import { dirname } from "path";
import inquirer from "inquirer";
import config from "../config.js";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import mainConfigs from "../../config.js";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// CLI components
const Spinner = CLI.Spinner;

// Hashcat command path
const hashcatCommand = mainConfigs.WINDOWS ? `cd ${mainConfigs.HASHCAT_PATH} ; hashcat` : "hashcat";

// Function to execute a command using npm
const executeCommand = async (wordlistPath, rulesFilePath) => {
	try {
		const wordlistName = path.basename(wordlistPath, path.extname(wordlistPath));
		const ruleFileName = path.basename(rulesFilePath, path.extname(rulesFilePath));
		const outputFilePath = `./wordlist-rules-combinations/results/${wordlistName}+${ruleFileName}.txt`;
		const command = mainConfigs.WINDOWS
			? `${hashcatCommand} --stdout "${wordlistPath}" -r "${rulesFilePath}" | findstr /V /C:"Cannot convert rule for use on OpenCL device" /C:"Skipping invalid or unsupported rule in file" > "${outputFilePath}"`
			: `${hashcatCommand} --stdout "${wordlistPath}" -r "${rulesFilePath}" | grep -v -e "Cannot convert rule for use on OpenCL device" -e "Skipping invalid or unsupported rule in file" > "${outputFilePath}"`;

		execSync(command, { stdio: "inherit" });

		// Count the number of lines in the output file
		const exportedCombinations = fs.readFileSync(outputFilePath, 'utf-8').split('\n').length - 1;

		console.log(chalk.green(`Output saved to: ${outputFilePath}.\n    Number of combinations exported: ${exportedCombinations}`));
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
};

// Function to get the wordlist path based on the selection
const getWordlistPath = (selectedWordlist) => {
	const currentDir = new URL('.', import.meta.url).pathname;
	return selectedWordlist === "base-word.txt"
		? path.join(currentDir, "..", selectedWordlist)
		: path.join(currentDir, "..", config.LOCAL_WORLISTS_DIRECTORY, selectedWordlist);
};

// Main function to handle user input and execute commands
const run = async () => {
	const exclusions = [".gitkeep", ".gz"];
	const wordlistFiles = fs.readdirSync(config.LOCAL_WORLISTS_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));
	const rulesFiles = fs.readdirSync(config.LOCAL_RULES_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));

	const {
		selectedWordlist,
		selectedRules
	} = await inquirer.prompt([{
		type: "rawlist",
		name: "selectedWordlist",
		message: "Select a wordlist file:",
		choices: ["base-word.txt", ...wordlistFiles, "Exit"]
	}, {
		type: "rawlist",
		name: "selectedRules",
		message: "Select a .rule file:",
		choices: ["ALL", ...rulesFiles, "Exit"]
	}]);

	if (selectedWordlist === "Exit" || selectedRules === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	const wordlistPath = getWordlistPath(selectedWordlist);

	if (selectedRules === "ALL") {
		// Process all .rule files in the directory
		for (const ruleFile of rulesFiles) {
			const rulePath = path.join(__dirname, "..", config.LOCAL_RULES_DIRECTORY, ruleFile);
			const status = new Spinner(`Processing ${ruleFile}...`);
			status.start();

			await executeCommand(wordlistPath, rulePath);

			status.stop();
		}
	} else {
		const rulePath = path.join(__dirname, "..", config.LOCAL_RULES_DIRECTORY, selectedRules);
		const status = new Spinner("Processing...");
		status.start();

		// Simulate an asynchronous operation
		setTimeout(async () => {
			status.stop();

			// Run the selected command
			await executeCommand(wordlistPath, rulePath);
		}, 500);
	}
};

run();
