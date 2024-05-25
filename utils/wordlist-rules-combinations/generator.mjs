#!/usr/bin/env node

import fs from "fs/promises";
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
const hashcatCommand = mainConfigs.WINDOWS ?
	`cd ${mainConfigs.HASHCAT_PATH} ; hashcat` :
	"hashcat";

// Function to execute a command using npm
const executeCommand = async (wordlistPath, rulesFilePath) => {
	try {
		const wordlistName = path.basename(wordlistPath, path.extname(wordlistPath));
		const ruleFileName = path.basename(
			rulesFilePath,
			path.extname(rulesFilePath)
		);
		const outputFilePath = `./wordlist-rules-combinations/results/${wordlistName}+${ruleFileName}.txt`;
		const command = mainConfigs.WINDOWS ?
			`${hashcatCommand} --stdout "${wordlistPath}" -r "${rulesFilePath}" | findstr /V /C:"Cannot convert rule for use on OpenCL device" /C:"Skipping invalid or unsupported rule in file" > "${outputFilePath}"` :
			`${hashcatCommand} --stdout "${wordlistPath}" -r "${rulesFilePath}" | grep -v -e "Cannot convert rule for use on OpenCL device" -e "Skipping invalid or unsupported rule in file" > "${outputFilePath}"`;

		execSync(command, {
			stdio: "inherit"
		});

		// Count the number of lines in the output file
		const exportedCombinations = (
				await fs.readFile(outputFilePath, "utf-8")
			)
			.toString()
			.split("\n").length - 1;

		console.log(
			chalk.green(
				`Output saved to: ${outputFilePath}.\n    Number of combinations exported: ${exportedCombinations}`
			)
		);
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
};

// Function to get the wordlist path based on the selection
const getWordlistPath = (selectedWordlist) => {
	const currentDir = new URL(".", import.meta.url).pathname;
	return selectedWordlist === "base-word.txt" ?
		path.join(currentDir, "..", selectedWordlist) :
		path.join(currentDir, "..", config.LOCAL_WORLISTS_DIRECTORY, selectedWordlist);
};

// Function to get the rules file path based on the selection
const getRulesFilePath = (selectedRules) => {
	const currentDir = new URL(".", import.meta.url).pathname;
	return path.join(currentDir, "..", config.LOCAL_RULES_DIRECTORY, selectedRules);
};

// Function to display a spinner while processing
const showSpinner = async (message, operation) => {
	const status = new Spinner(message);
	status.start();
	try {
		await operation();
	} catch (error) {
		console.error(chalk.red(`Error: ${error.message}`));
	} finally {
		status.stop();
	}
};

// Main function to handle user input and execute commands
const run = async () => {
	const fileExclusions = [".gitkeep", ".gz"];

	const wordlistFiles = (
		await fs.readdir(config.LOCAL_WORLISTS_DIRECTORY)
	).filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));

	const rulesFiles = (
		await fs.readdir(config.LOCAL_RULES_DIRECTORY)
	).filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));

	const {
		selectedWordlist,
		selectedRules
	} = await inquirer.prompt([{
			type: "rawlist",
			name: "selectedWordlist",
			message: "Select a wordlist file:",
			choices: ["base-word.txt", ...wordlistFiles, "Exit"]
		},
		{
			type: "rawlist",
			name: "selectedRules",
			message: "Select a .rule file:",
			choices: ["ALL", ...rulesFiles, "Exit"]
		}
	]);

	if (selectedWordlist === "Exit" || selectedRules === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	const wordlistPath = getWordlistPath(selectedWordlist);

	if (selectedRules === "ALL") {
		// Process all .rule files in the directory
		await showSpinner("Processing all rules...", async () => {
			for (const ruleFile of rulesFiles) {
				const rulePath = getRulesFilePath(ruleFile);
				await executeCommand(wordlistPath, rulePath);
			}
		});
	} else {
		// Process a single .rule file
		const rulePath = getRulesFilePath(selectedRules);
		await showSpinner("Processing rules...", async () => {
			await executeCommand(wordlistPath, rulePath);
		});
	}
};

run();
