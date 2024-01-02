#!/usr/bin/env node

import fs from "fs";
import CLI from "clui";
import chalk from "chalk";
import * as path from "path";
import { dirname } from "path";
import inquirer from "inquirer";
import config from "../config.js";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the project directory
const projectDirectory = __dirname;

// CLI components
const Spinner = CLI.Spinner;

// Function to run a command using npm
const runCommand = async (wordlist, rulesFile) => {
	try {
		const wordlistName = path.basename(wordlist).replace(/\.[^/.]+$/, "");
		const ruleFileName = path.basename(rulesFile).replace(/\.[^/.]+$/, "");
		const outputFilePath = `../utils/wordlist-rules-combinations/results/${wordlistName}+${ruleFileName}.txt`;

		execSync(`hashcat --stdout "${wordlist}" -r "${rulesFile}" | grep -v -e "Cannot convert rule for use on OpenCL device" -e "Skipping invalid or unsupported rule in file" > "${outputFilePath}"`, {
			stdio: "inherit"
		});

		console.log(chalk.green(`Output saved to: ${outputFilePath}`));
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
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

	if (selectedWordlist !== "Exit" || selectedRules !== "Exit") {
		if (selectedRules === "ALL") {
			// Process all .rule files in the directory
			rulesFiles.forEach(async (ruleFile) => {
				const wordlistPath = getWordlistPath(selectedWordlist);
				const rulePath = path.join(projectDirectory, "..", config.LOCAL_RULES_DIRECTORY, ruleFile);

				const status = new Spinner(`Processing ${ruleFile}...`);
				status.start();

				await runCommand(wordlistPath, rulePath);

				status.stop();
			});
		} else {
			const wordlistPath = getWordlistPath(selectedWordlist);
			const rulePath = path.join(projectDirectory, "..", config.LOCAL_RULES_DIRECTORY, selectedRules);

			const status = new Spinner("Processing...");
			status.start();

			// Simulate an asynchronous operation
			setTimeout(() => {
				status.stop();

				// Run the selected command
				runCommand(wordlistPath, rulePath);
			}, 500);
		}
	}
};

// Helper function to get the wordlist path based on the selection
const getWordlistPath = (selectedWordlist) => {
	return selectedWordlist === "base-word.txt"
		? path.join(projectDirectory, "..", selectedWordlist)
		: path.join(projectDirectory, "..", config.LOCAL_WORLISTS_DIRECTORY, selectedWordlist);
};

run();
