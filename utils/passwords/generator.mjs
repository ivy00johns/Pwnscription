#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import config from "../config.js";

let allCombinations = [];

// Prompt user to select generation process
const { selectedAction } = await inquirer.prompt([{
	type: "list",
	name: "selectedAction",
	message: "Select generation process:",
	choices: [".config.js", "manual", "Exit"]
}]);

// Function to generate combinations of a given array of words
const generateCombinations = (words) => {
	const combinations = new Set();

	// Recursive function to generate combinations
	const generateCombo = (currentCombo, remainingWords) => {
		if (remainingWords === 0) {
			combinations.add(currentCombo);
			return;
		}

		for (let i = 0; i < words.length; i++) {
			// Avoid combining the same word with itself or repeating within the combination
			if (!currentCombo.includes(words[i])) {
				generateCombo(currentCombo + words[i], remainingWords - 1);
			}
		}
	};

	for (let k = 1; k <= config.MAX_WORDS_USED; k++) {
		for (let i = 0; i < words.length; i++) {
			generateCombo(words[i], k - 1);
		}
	}

	return Array.from(combinations);
};

// Function to add a word to the array
const addWordToArray = async () => {
	const { word } = await inquirer.prompt({
		type: "input",
		message: "Enter a word (press enter to finish):",
		name: "word",
	});
	return word.trim(); // Trim to remove leading/trailing spaces
};

// Function to start the input process
const inputWords = async () => {
	const wordsArray = [];

	while (true) {
		const word = await addWordToArray();
		if (!word) {
			break;
		}

		wordsArray.push(word);
	}

	console.log("Entered words:", wordsArray);

	allCombinations = generateCombinations(wordsArray);
};

if (selectedAction === ".config.js") {
	allCombinations = generateCombinations(config.WORD_LIST);
} else if (selectedAction === "manual") {
	await inputWords().catch((error) => {
		console.error("Error:", error);
	});
} else if (selectedAction === "Exit") {
	console.log(chalk.yellow("Goodbye!"));
	process.exit(0);
}

// Custom sorting function based on config variables
const sortCombinations = (a, b) => {
	if (config.SORT_BY_LENGTH) {
		if (a.length !== b.length) {
			return config.SORT_LENGTH_ASCENDING ?
				a.length - b.length :
				b.length - a.length;
		}
	}

	return config.SORT_ALPHABETICALLY ? a.localeCompare(b) : 0;
};

// Sort combinations using the custom sorting function
const sortedCombinations = allCombinations.sort(sortCombinations);

// Filter combinations based on config variables for min/max length
const filteredCombinations = sortedCombinations.filter((combo) => {
	const length = combo.length;
	return (
		(!config.MIN_LENGTH || length >= config.MIN_LENGTH) &&
		(!config.MAX_LENGTH || length <= config.MAX_LENGTH)
	);
});

// Print specified number of items in the terminal
const itemsToPrint = Math.min(config.PRINT_ITEMS, filteredCombinations.length);
console.log(`Printing ${itemsToPrint} items:`);
console.log(filteredCombinations.slice(0, itemsToPrint));
console.log(`Generated ${filteredCombinations.length} unique combinations.`);

// Write the specified number of combinations to a file
const combinationsToWrite = Math.min(config.GENERATE_PERMUTATIONS, filteredCombinations.length);
const outputFileName = config.EXPORT_FILE_NAME;

// Sort combinations alphabetically before writing to the file
const sortedForFile = filteredCombinations.sort(sortCombinations);
fs.writeFileSync(outputFileName, sortedForFile.slice(0, combinationsToWrite).join("\n"));

// Print the actual number of combinations written to the file
console.log(`${combinationsToWrite} combinations written to ${outputFileName}.`);
