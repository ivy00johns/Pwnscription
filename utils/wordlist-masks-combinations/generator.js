const fs = require("fs");
const path = require("path");
const config = require("../config");
const mainConfig = require("../../config");

function readFile(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8").split(/[\s,]+/).filter((v, i, a) => a.indexOf(v) === i).filter(function(e) {
			return e === 0 || e;
		});
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
}

function readMasks(filePath) {
	try {
		return fs
			.readFileSync(filePath, "utf8")
			.split("\n")
			.map(line => line.trim())
			.filter(line => line !== "");
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
}

function applyMask(string, mask) {
	// Repeat the mask until it matches or exceeds the length of the input string
	const repeatedMask = mask.repeat(Math.ceil(string.length / mask.length));

	// Use slice to ensure the mask length matches the input string length
	const adjustedMask = repeatedMask.slice(0, string.length);

	return string.split('').map((char, index) => (adjustedMask.charAt(index) === '?' ? char : adjustedMask.charAt(index))).join('');
}

function generate(data, masks) {
	const list = new Set();
	for (let string of data) {
		for (let mask of masks) {
			const maskResult = applyMask(string, mask);
			list.add(maskResult);
		}
	}

	const result = Array.from(list).join('\n');
	return result;
}

function processFilesInDirectory(directoryPath) {
	const files = fs.readdirSync(directoryPath);

	files.forEach(file => {
		const filePath = path.join(directoryPath, file);

		if (fs.statSync(filePath).isFile()) {
			const inputData = readFile(config.TEST_MASKS_WORD_LIST);
			const maskData = readMasks(filePath);

			const result = generate(inputData, maskData);

			// Build the output filename based on the mask file name
			const maskFileName = path.basename(filePath).replace(/\.[^/.]+$/, "");
			const outputFileName = `${maskFileName}-${config.GENERIC_MASKS_RESULTS_FILENAME}`;

			// Write result to the specified directory and filename
			const outputPath = path.join(config.WORDLIST_MASKS_RESULTS_DIRECTORY, outputFileName);

			try {
				fs.writeFileSync(outputPath, result);
				console.log(`Generation successful for ${file}. Check ${outputFileName} for the result. Lines written: ${result.split("\n").length}`);
			} catch (error) {
				console.error(`Error writing to ${outputFileName}: ${error.message}`);
			}
		}
	});
}

// Replace 'YOUR_DIRECTORY_PATH' with the actual directory path you want to process
const directoryPath = mainConfig.LOCAL_MASKS_DIRECTORY;
processFilesInDirectory(directoryPath);
