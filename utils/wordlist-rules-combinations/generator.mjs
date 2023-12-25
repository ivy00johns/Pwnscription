import chalk from "chalk";
import inquirer from "inquirer";
import CLI from "clui";
import fs from "fs";
import { execSync } from "child_process";
import clipboardy from "clipboardy";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import config from "../../config.js";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Set the project directory
const projectDirectory = __dirname;

// CLI components
const Spinner = CLI.Spinner;

// Function to run a command using npm
async function runCommand(wordlist, rulesFile) {
	try {
		const wordlistName = path.basename(wordlist).replace(/\.[^/.]+$/, "");
		const ruleFileName = path.basename(rulesFile).replace(/\.[^/.]+$/, "");

		execSync(`hashcat --stdout "${wordlist}" -r "${rulesFile}" -o "./utils/wordlist-rules-combinations/results/${wordlistName}+${ruleFileName}.txt"`, {
			stdio: "inherit"
		});
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
}

// Main function to handle user input and execute commands
async function run() {
	const exclusions    = [".gitkeep", ".gz"];
	const wordlistFiles = fs.readdirSync(config.LOCAL_WORLISTS_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));
	const rulesFiles    = fs.readdirSync(config.LOCAL_RULES_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));

	const {
		selectedWordlist,
		selectedRules
	} = await inquirer.prompt([{
		type: "rawlist",
		name: "selectedWordlist",
		message: "Select a wordlist file:",
		choices: ["base-word.txt", ...wordlistFiles, "NONE", "Exit"]
	}, {
		type: "rawlist",
		name: "selectedRules",
		message: "Select a .rule file:",
		choices: [...rulesFiles, "NONE", "Exit"]
	}]);

	if (selectedWordlist === "Exit" || selectedRules === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	if (selectedWordlist !== "Exit" || selectedRules !== "Exit") {
		let wordlistPath;

		if (selectedWordlist === "base-word.txt") {
			wordlistPath = `${path.join(projectDirectory, selectedWordlist)}`;
		} else {
			wordlistPath = `${path.join(projectDirectory, "../..", config.LOCAL_WORLISTS_DIRECTORY, selectedWordlist)}`;
		}
		
		const rulePath = `${path.join(projectDirectory, "../..", config.LOCAL_RULES_DIRECTORY, selectedRules)}`;

		const status = new Spinner("Loading...");
		status.start();

		// Simulate an asynchronous operation
		setTimeout(() => {
			status.stop();

			// Run the selected command
			runCommand(wordlistPath, rulePath);
		}, 500);
	}
}

run();
