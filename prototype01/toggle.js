autowatch = 1;

enabledInfix = " | AI:";

function bang() {

	post("[toggle.js] bang\n");

	// Get the selected track.
	var selectedTrack = new LiveAPI("live_set view selected_track");
	var trackName = selectedTrack.get("name").toString();

	// Check if the track is already enabled.
	var infixPosition = trackName.indexOf(enabledInfix);
	var isTrackEnabled = infixPosition != -1;

	// Track is already enabled, so disable it.
	if (isTrackEnabled) {
		var split = trackName.split(enabledInfix);
		post("Split: ", split, "\n");
		trackName = trackName.split(enabledInfix)[0];
		post("Track name: ", trackName, "\n");
		selectedTrack.set("name", trackName);
	}

	// Track is not enabled, so enable it.
	else {
		var selectedIntrument = getSelectedInstrument();
		trackName = trackName + enabledInfix + selectedIntrument;
		post("Track name: ", trackName, "\n");
		selectedTrack.set("name", trackName);
	}

}

function getSelectedInstrument() {
	// SelectedGenre is a umenu.
	var slider = this.patcher.getnamed("selectedInstrument");

	// Get the genre name from the config.
	var items = slider.getattr("items")

	// Get and return the selected genre.
	var selectedIndex = slider.getvalueof();
	var selectedItem = items[selectedIndex * 2];
	return selectedItem;
}