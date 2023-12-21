const fs = require("fs");
const logos = require("../scripts/logos");

let networksCracked = [];

// Check if a network has already been cracked based on its hash
function hasNetworkAlreadyBeenCracked(resultHash) {
	return networksCracked.some(network => network[2].split(":")[0] === resultHash.split(":")[0]);
}

// Detect cracked networks based on the existence of output.txt files
async function detectCrackedNetworks() {
	const hashcatDir = "./hashcat/outputs/";

	try {
		// Read all files in the ./hashcat/outputs/ directory
		const files = fs.readdirSync(hashcatDir);

		// Loop through each file
		for (const file of files) {
			// Check if the file is an output.txt file
			if (file.endsWith("-output.txt")) {
				// Read the contents of the file
				const filePath = `${hashcatDir}${file}`;
				const content = fs.readFileSync(filePath, "utf8");

				// Check if the content is not empty
				if (content.trim() !== "") {
					// Process the content (assuming it follows a specific format)
					const parts = content.split(":");
					if (parts.length >= 4) {
						const resultHash = parts[parts.length - 4] + ":" + parts[parts.length - 3];
						if (!hasNetworkAlreadyBeenCracked(resultHash)) {
							const ssid = parts[parts.length - 2];
							const password = parts[parts.length - 1].trim();
							networksCracked.push([ssid, password, resultHash]);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error(`Error reading hashcat output: ${error.message}`);
	}
}

// Main function
async function main() {
	await detectCrackedNetworks();
	logos.printCrackedNetworks();
}

// Run the script
main();
