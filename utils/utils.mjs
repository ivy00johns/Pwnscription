import fs from "fs";
import CLI from "clui";
import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";

// CLI components
const Spinner = CLI.Spinner;

// Function to get available commands from package.json
function getAvailableCommands() {
	const packageJsonPath = "./utils/package.json";

	try {
		const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const scripts = packageJsonData.scripts;

		if (scripts) {
			return Object.keys(scripts).map((script) => ({
				name: `${script}: ${packageJsonData.scripts[script]}`,
				value: script,
			}));
		} else {
			console.error(chalk.red("No scripts found in ./utils/package.json."));
			process.exit(1);
		}
	} catch (error) {
		console.error(chalk.red(`Error reading ${packageJsonPath}: ${error.message}`));
		process.exit(1);
	}
}

// Function to run a command using npm
async function runCommand(command) {
	try {
		execSync(`npm run --prefix ./utils ${command}`, {
			stdio: "inherit"
		});
	} catch (error) {
		console.error(chalk.red(`Error running command: ${error.message}`));
	}
}

async function run() {
	const availableCommands = getAvailableCommands();
	const {
		command
	} = await inquirer.prompt([{
		type: "list",
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
			runCommand(command);
		}, 500);
	}
}

run();
