#!/usr/bin/env node

import fs from "fs";
import CLI from "clui";
import path from "path";
import chalk from "chalk";
import { dirname } from "path";
import inquirer from "inquirer";
import clipboardy from "clipboardy";
import { fileURLToPath } from "url";
import config from "../../config.js";
import { execSync } from "child_process";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Set the project directory
const projectDirectory = __dirname;

// CLI components
const Spinner = CLI.Spinner;

// Generate a random number
const randomNumber = Math.floor(Math.random() * 1000);

// Hashcat command path
const hashcatCommand = config.WINDOWS ? `cd ${config.HASHCAT_PATH} && hashcat` : "hashcat";

// Function to get available commands from package.json
function getAvailableCommands() {
	const packageJsonPath = "package.json";

	try {
		const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const scripts = packageJsonData.scripts;

		if (scripts) {
			return Object.keys(scripts).map((script) => ({
				name: `${script}: ${packageJsonData.scripts[script]}`,
				value: script,
			}));
		} else {
			console.error(chalk.red("No scripts found in package.json."));
			process.exit(1);
		}
	} catch (error) {
		console.error(chalk.red(`Error reading ${packageJsonPath}: ${error.message}`));
		process.exit(1);
	}
}

// Function to run a command or copy it to clipboard
async function runCommandOrCopyToClipboard(command) {
	const {
		action
	} = await inquirer.prompt([{
		type: "list",
		name: "action",
		message: "Select an action:",
		choices: ["Execute", "Copy to Clipboard", "Cancel"]
	}]);

	if (action === "Cancel") {
		console.log(chalk.yellow("Action canceled."));
		return;
	}

	if (action === "Copy to Clipboard") {
		clipboardy.writeSync(command);
		console.log(chalk.green("Command copied to clipboard!"));
	} else if (action === "Execute") {
		console.log(chalk.blue(`Executing command: ${command}`));
		try {
			execSync(command, {
				stdio: "inherit"
			});
		} catch (error) {
			console.error(chalk.red(`Error running command: ${error.message}`));
		}
	}
}

// Function to run a command using npm
async function runNpmCommand(command) {
	try {
		execSync(`npm run ${command}`, {
			stdio: "inherit"
		});
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
}

// Main function to handle user input and execute commands
async function run() {
	const {
		commandType
	} = await inquirer.prompt([{
		type: "list",
		name: "commandType",
		message: "Select a command type:",
		choices: ["Standard Commands", "Custom Commands", "Exit"]
	}]);

	if (commandType === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	if (commandType === "Standard Commands") {
		const availableCommands = getAvailableCommands();
		const {
			command
		} = await inquirer.prompt([{
			type: "rawlist",
			name: "command",
			message: "Select a command to run:",
			choices: [...availableCommands, {
				name: "Exit",
				value: "exit"
			}]
		}]);

		if (command !== "exit") {
			const status = new Spinner("Loading...");
			status.start();

			// Simulate an asynchronous operation
			setTimeout(() => {
				status.stop();
				console.log(chalk.green(`You selected: ${command}`));

				// Run the selected command
				runNpmCommand(command);
			}, 500);
		}
	}

	if (commandType === "Custom Commands") {
		const fileExclusions = [".gitkeep", ".gz", ".torrent", ".7z", "._"];
		const hccapxFiles = fs
			.readdirSync(config.LOCAL_HCCAPX_DIRECTORY)
			.filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));
		const wordlistFiles = fs
			.readdirSync(config.LOCAL_WORLISTS_DIRECTORY)
			.filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));
		const rulesFiles = fs
			.readdirSync(config.LOCAL_RULES_DIRECTORY)
			.filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));
		const masksFiles = fs
			.readdirSync(config.LOCAL_MASKS_DIRECTORY)
			.filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));

		if (hccapxFiles.length === 0) {
			console.log(
				chalk.yellow(
					`No hccapx .hc22000 files found. Please run "npm run generate".`
				)
			);
			process.exit(0);
		}

		const {
			selectedHccapx,
			selectedWordlist,
			selectedRules,
			useMasks
		} = await inquirer.prompt([{
				type: "rawlist",
				name: "selectedHccapx",
				message: "Select an .hccapx file:",
				choices: hccapxFiles
			},
			{
				type: "rawlist",
				name: "selectedWordlist",
				message: "Select a wordlist file:",
				choices: [...wordlistFiles, "NONE"]
			},
			{
				type: "rawlist",
				name: "selectedRules",
				message: "Select a .rule file:",
				choices: [...rulesFiles, "NONE"]
			},
			{
				type: "confirm",
				name: "useMasks",
				message: "Do you want to use a mask?",
				default: false
			}
		]);

		// Generate the custom command based on user selections
		const customCommand = await generateCustomCommand(
			selectedHccapx,
			selectedWordlist,
			selectedRules,
			useMasks,
			masksFiles.length > 0 ? await selectMaskFile(masksFiles) : ""
		);

		console.log(chalk.green(`Generated Custom Command: ${customCommand}`));

		// Prompt the user to execute or copy the command to clipboard
		await runCommandOrCopyToClipboard(customCommand);
	}
}

// Function to generate a custom command based on user selections
async function generateCustomCommand(
	hccapx,
	wordlist,
	rules,
	useMasks,
	customMask
) {
	const sessionBaseName = hccapx.replace(/\.hc22000$/, "");
	const sessionName = `${sessionBaseName}-${randomNumber}`;

	// Helper function to construct the base hashcat command
	function buildBaseCommand(attackMode) {
		const hccapxPath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_HCCAPX_DIRECTORY,
			hccapx
		)}`;

		const outputPath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_OUTPUT_FILE_DIRECTORY,
			`${sessionName}-output.txt`
		)}`;

		const potfilePath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_POTFILES_DIRECTORY,
			`${sessionName}-potfile.txt`
		)}`;

		return `${hashcatCommand} --hash-type=${config.HASH_TYPE} --attack-mode=${attackMode} --session ${sessionName} --hwmon-temp-abort=${config.ABORT_TEMPERATURE} -w ${config.ABORT_WAIT_TIME} --potfile-path "${potfilePath}" --outfile "${outputPath}" "${hccapxPath}"`;
	}

	// Define attack modes and their corresponding descriptions
	const attackModes = {
		0: "0 - Straight Attack: Dictionary Attack",
		3: "3 - Brute-force Attack",
		6: "6 - Hybrid Attack: Dictionary + Mask",
		7: "7 - Hybrid Attack: Mask + Dictionary",
		9: "9 - Hybrid Attack: Mask + Mask"
	};

	// Function to build the final command based on choices
	function buildCommand(attackMode) {
		let command = buildBaseCommand(attackMode);

		const wordlistPath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_WORLISTS_DIRECTORY,
			wordlist
		)}`;

		const rulePath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_RULES_DIRECTORY,
			rules
		)}`;

		const maskPath = `${path.join(
			projectDirectory,
			"../..",
			config.LOCAL_MASKS_DIRECTORY,
			customMask
		)}`;

		// Add wordlist
		if (wordlist !== "NONE") {
			command += ` "${wordlistPath}"`;
		}

		// Add rules file
		if (rules !== "NONE") {
			command += ` --rules-file="${rulePath}"`;
		}

		// Add mask file if applicable
		if (useMasks) {
			command += ` "${maskPath}"`;
		}

		return command;
	}

	// Prompt for attack mode based on the selected options
	let attackMode;

	switch (true) {
		case wordlist !== "NONE" && rules !== "NONE":
			attackMode = useMasks ?
				await selectAttackMode([0, 9], 9) :
				await selectAttackMode([0, 9], 9);
			break;
		case wordlist === "NONE" && rules !== "NONE":
			attackMode = useMasks ? await selectAttackMode([0, 9], 9) : 0;
			break;
		case wordlist !== "NONE" && rules === "NONE":
			attackMode = useMasks ?
				await selectAttackMode([0, 3, 6, 7, 9], 6) :
				await selectAttackMode([0, 3, 9], 0);
			break;
		case wordlist === "NONE" && rules === "NONE":
			attackMode = useMasks ?
				await selectAttackMode([0, 3, 9], 3) :
				await selectAttackMode([0, 3], 0);
			break;
		default:
			console.log(`No command present.`);
			process.exit(0);
	}

	return buildCommand(attackMode);
}

// Helper function to display attack modes and prompt for selection
async function selectAttackMode(choiceValues, defaultValue) {
	const choices = choiceValues.map((element) => ({
		value: element,
		name: element === defaultValue ?
			`${attackMode[element]} [DEFAULT]` :
			attackMode[element]
	}));

	const {
		attackMode
	} = await inquirer.prompt([{
		type: "rawlist",
		name: "attackMode",
		message: "Choose an attack mode:",
		choices,
		default: defaultValue
	}]);

	return attackMode;
}

// Helper function to select a mask file
async function selectMaskFile(masksFiles) {
	const {
		selectedMaskFile
	} = await inquirer.prompt([{
		type: "rawlist",
		name: "selectedMaskFile",
		message: "Select a .hcmask file:",
		choices: masksFiles
	}]);

	return selectedMaskFile;
}

run();
