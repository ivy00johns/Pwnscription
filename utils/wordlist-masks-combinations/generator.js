const fs = require("fs");
const config = require("../config");

const inputData = readFile(config.TEST_MASKS_WORD_LIST);
const maskData = readMasks(config.TEST_MASKS_FILE);

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
	return string.replace(/./g, (char, index) => (mask.charAt(index) === "?" ? char : mask.charAt(index)));
}

function generate(data, masks) {
	const list = new Set();
	for (let string of data) {
		for (let mask of masks) {
			const maskResult = applyMask(string, mask);
			list.add(maskResult);
		}
	}

	const result = Array.from(list).join("\n");
	return result;
}

const result = generate(inputData, maskData);

// Build the output filename based on the mask file name
const maskFileName = config.TEST_MASKS_FILE.split("/").pop().replace(/\.[^/.]+$/, "");
const outputFileName = `${maskFileName}-${config.GENERIC_MASKS_RESULTS_FILENAME}`;

// Write result to the specified directory and filename
const outputPath = `${config.WORDLIST_MASKS_RESULTS_DIRECTORY}/${outputFileName}`;
try {
	fs.writeFileSync(outputPath, result);
	console.log(`Generation successful. Check ${outputFileName} for the result. Lines written: ${result.split("\n").length}`);
} catch (error) {
	console.error(`Error writing to ${outputFileName}: ${error.message}`);
}
