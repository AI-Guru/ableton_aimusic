autowatch = 1;
inlets = 1;
outlets = 1;



// This is the entry point for the script.
function bang() {
	// Relay the command.
	outlet(0, "executeCommand", "fillup");
}
