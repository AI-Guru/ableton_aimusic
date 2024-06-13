autowatch = 1;
inlets = 1;
outlets = 1;



// This is the entry point for the script.
function bang() {
	// Relay the command.
    // The method that should be called is "handleFillUpResult" and it should receive two arguments: 36 and 24.
    // The signature is function handleFillUpResult(result, startBeat, lengthBeats)
    var startBeat = 36;
    var lengthBeats = 24;
    outlet(0, "handleFillUpResult", {}, startBeat, lengthBeats);
}
