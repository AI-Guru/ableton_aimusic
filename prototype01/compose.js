autowatch = 1;
inlets = 1;
outlets = 1;

// This is the entry point for the script.
function bang() {


	var instrument = getSelectedInstrumentMidi();
	post("[compose.js] Selected instrument MIDI: " + instrument + "\n");

	var songData = {
        "tracks": [],
    }

    var parameters = {
        "instrument": instrument,
        "genre": "BLACKMETAL",
        "density": 4,
        "temperature": 0.8,
        "harmonymode": "polyphone",
        "instrumentmode": "full",
        "selectednotes": ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"],
		"synthesize": false,
    }

    var command = {
        "command": "addinstrument",
        "data": songData,
        "parameters": parameters
    };
	
	outlet(0, "postCommand", command);

	return;


	// Print the keys and values of the config object
	for (var key in config) {
		post(key + ": " + config[key] + "\n");
	}

	var data = {};

	for (var index = 0; index < config.trackNames.length; index++) {

		// Get the track name and index.
		var trackName = config.trackNames[index];
		var trackIndex = getTrackIndexWithName(trackName);
		post(trackName + " " + trackIndex + "\n");

		// Get the arrangement clips of that track.
		var clipIndices = getArrangementClipIndices(trackIndex);

		// Sort the arrangement clips.
		clipIndices = sortClipIndicesByPosition(trackIndex, clipIndices);
		
		post("Clips: " + clipIndices + "\n");

	}

}


function getSelectedInstrumentMidi() {

	var config = getConfig();
	var instruments = config["instruments"];
	var instrumentsToMidi = config["instrumentsToMidi"];
	post("[compose.js] Instruments to MIDI: " + instrumentsToMidi + "\n");

	// Read the dropdown "selectedInstrument" from the Max patch.
    var selectedInstrument = this.patcher.getnamed("selectedInstrument").getvalueof();
	post("[compose.js] Selected instrument: " + selectedInstrument + "\n");
    var selectedInstrumentName = instruments[selectedInstrument];
    post("[compose.js] Selected instrument name: " + selectedInstrumentName + "\n");
    var selectedInstrumentMidi = instrumentsToMidi[selectedInstrumentName];
    post("[compose.js] Selected instrument MIDI: " + selectedInstrumentMidi + "\n");
	return selectedInstrumentMidi;
}


function getConfig(dict) {

	if (dict == null) {
		dict = new Dict("configDictionary");
	}

    var keys = dict.getkeys();
    var result = {};

    if (keys) {
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = dict.get(key);

            if (typeof value === 'object' && value instanceof Dict) {
                result[key] = getConfig(value);
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}


function postCommandResponse(result) {

	post("[compose.js] Post command response received.\n");

	// Get the command name from the result object.
	var commandName = result.command.command;
	if (commandName == "addinstrument") {
		handleAddInstrumentResult(result);
	}
	else {
		post("Unknown command name: " + commandName + "\n");
	}

}


function handleAddInstrumentResult(result) {
	post("[compose.js] Handling addinstrument result.\n");

	var config = getConfig();

	//post(JSON.stringify(result) + "\n");

	// Get the track data from the result object.
	var songData = result["result"]["song_data"];
	//post("Song data: " + JSON.stringify(songData) + "\n");
	
	// Get the last track.
	var tracks = songData["tracks"];
	var track = tracks[tracks.length - 1];
	//post(JSON.stringify(track) + "\n");

	// Get the bars of the track.
	var bars = track["bars"];
	post("Bars: " + bars.length + "\n");

	// Get track name.
	var instrument = track["instrument"];
	post("Instrument: " + instrument + "\n");
	var trackName = config["midiToTrackNames"][instrument];
	post("Track name: " + trackName + "\n");

}













// THIS IS SOME OLD STUFF THAT MIGHT BE USEFUL LATER







function getTrackIndexWithName(name) {
	var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");
	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		if (track.get("name") == name) {
			return i;
		}
	}
	return -1;
}


function getArrangementClipIndices(trackIndex) {
	var track = new LiveAPI("live_set tracks " + trackIndex);
	var arrangementClipsCount = track.getcount("arrangement_clips");
	var arrangementClipsIndices = [];
	for (var i = 0; i < arrangementClipsCount; i++) {
		arrangementClipsIndices.push(i);
	}
	return arrangementClipsIndices;
}


function sortClipIndicesByPosition(trackIndex, clipIndices) {
	var track = new LiveAPI("live_set tracks " + trackIndex);
	clipIndices.sort(function(a, b) {
		var clipA = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + a);
		var clipB = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + b);
		return clipA.get("position") - clipB.get("position");
	});
	return clipIndices;
}