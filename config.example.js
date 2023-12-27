module.exports = {
	// Pwnagotchi SSH configuration
	PWNAGOTCHI_SSH: {
		HOST_ADDRESS: "", // Pwnagotchi SSH host address
		USERNAME: "", // Pwnagotchi SSH username
		PASSWORD: "", // Pwnagotchi SSH password
		PORT: 22 // Pwnagotchi SSH port
	},

	// Windows configuration
	WINDOWS: false, // Flag to indicate if running on Windows
	HASHCAT_PATH: "", // Path to Hashcat on Windows

	// Paths for attach lists
	WORDLISTS: [
		"./hashcat/wordlists"
	],

	RULES: [
		"./hashcat/rules/best64.rule"
	],

	MASKS: [
		"./hashcat/masks"
	],

	// File paths
	HANDSHAKE_DIRECTORY: "~/handshakes", // Directory for Pwnagotchi handshakes
	PWNAGOTCHI_HANDSHAKES: "/home/pi/handshakes", // Pwnagotchi handshakes directory
	LOCAL_PCAP_DIRECTORY: "./handshakes/pcap", // Local pcap directory
	LOCAL_PMKID_DIRECTORY: "./handshakes/pmkid", // Local pmkid directory
	LOCAL_HCCAPX_DIRECTORY: "./handshakes/hccapx", // Local hccapx directory
	LOCAL_POTFILES_DIRECTORY: "./hashcat/potfiles", // Local potfiles directory
	LOCAL_OUTPUT_FILE_DIRECTORY: "./hashcat/outputs", // Local output file directory
	LOCAL_WORLISTS_DIRECTORY: "./hashcat/wordlists", // Local wordlists directory
	LOCAL_RULES_DIRECTORY: "./hashcat/rules", // Local rules directory
	LOCAL_MASKS_DIRECTORY: "./hashcat/masks", // Local masks directory

	// Hashcat script constants
	HASH_TYPE: 22000, // Hash type for Hashcat
	ABORT_TEMPERATURE: 100, // Abort temperature for Hashcat
	ABORT_WAIT_TIME: 2 // Abort wait time for Hashcat
};
