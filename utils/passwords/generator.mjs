#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import config from "../config.js";

let result = [];

const {
	action
} = await inquirer.prompt([{
	type: "list",
	name: "action",
	message: "Select generation process:",
	choices: [".config.js", "manual", "Exit"]
}]);

// Function to generate combinations of a given array of words
const generateCombinations = (words) => {
	const combinationsSet = new Set();

	// Recursive function to generate combinations
	const generate = (currentCombination, remainingWords) => {
		if (remainingWords === 0) {
			combinationsSet.add(currentCombination);
			return;
		}

		for (let i = 0; i < words.length; i++) {
			// Avoid combining the same word with itself or repeating within the combination
			if (
				currentCombination !== words[i] &&
				!currentCombination.includes(words[i])
			) {
				generate(currentCombination + words[i], remainingWords - 1);
			}
		}
	};

	for (let k = 1; k <= config.MAX_WORDS_USED; k++) {
		for (let i = 0; i < words.length; i++) {
			generate(words[i], k - 1);
		}
	}

	return Array.from(combinationsSet);
};

// Function to add a word to the array
const addWord = async () => {
	const response = await inquirer.prompt({
		type: "input",
		message: "Enter a word (press enter to finish):",
		name: "word",
	});
	return response.word.trim(); // Trim to remove leading/trailing spaces
};

// Function to start the input process
const enterWords = async () => {
	const enteredWords = [];

	while (true) {
		const word = await addWord();
		if (!word) {
			break;
		}

		enteredWords.push(word);
		// console.log(`Word "${word}" added.`);
	}

	console.log("Entered words:", enteredWords);

	result = generateCombinations(enteredWords);
};

if (action === ".config.js") {
	result = generateCombinations(config.WORD_LIST);
} else if (action === "manual") {
	await enterWords().catch((error) => {
		console.error("Error:", error);
	});
} else if (action === "Exit") {
	console.log(chalk.yellow("Goodbye!"));
	process.exit(0);
}

// Custom sorting function based on config variables
const customSort = (a, b) => {
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
const sortedResult = result.sort(customSort);

// Filter combinations based on config variables for min/max length
const filteredResult = sortedResult.filter((combo) => {
	const length = combo.length;
	return (
		(!config.MIN_LENGTH || length >= config.MIN_LENGTH) &&
		(!config.MAX_LENGTH || length <= config.MAX_LENGTH)
	);
});

// Print specified number of items in the terminal
const itemsToPrint = Math.min(config.PRINT_ITEMS, filteredResult.length);
console.log(`Printing ${itemsToPrint} items:`);
console.log(filteredResult.slice(0, itemsToPrint));
console.log(`Generated ${filteredResult.length} unique combinations.`);

// Write the specified number of combinations to a file
const combinationsToGenerate = config.GENERATE_PERMUTATIONS;
const outputFile = config.EXPORT_FILE_NAME;

// Sort combinations alphabetically before writing to the file
const sortedCombinations = filteredResult.sort(customSort);
fs.writeFileSync(outputFile, sortedCombinations.slice(0, combinationsToGenerate).join("\n"));
console.log(`Combinations written to ${outputFile}.`);
