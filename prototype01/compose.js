autowatch = 1;
inlets = 2;
outlets = 1;

// Load the config.
config = getConfig();

// This is the entry point for the script.
function bang() {
	executeCommand("addinstrument");
}


// Execute the command.
function executeCommand(commandName) {
	post("[compose.js] Executing command: " + commandName + "\n");
	if (commandName == "addinstrument") {
		executeAddInstrumentCommand();
	}
	else if (commandName == "clearall") {
		executeClearAllCommand();
	}
	else if (commandName == "cleartrack") {
		executeClearTrackCommand();
	}
	else {
		post("Unknown command: " + commandName + "\n");
	}
}


function executeAddInstrumentCommand() {

	// Get the selected instrument MIDI.
	var instrument = getSelectedInstrumentMidi();
	post("[compose.js] Selected instrument MIDI: " + instrument + "\n");

	// Get the instruments that are not the selected one.
	var allInstruments = config["midiInstruments"];
	var allInstrumentsWithoutSelected = allInstruments.filter(function(value, index, arr) {
		return value != instrument;
	});
	post("[compose.js] All instruments without selected: " + allInstrumentsWithoutSelected + "\n");

	// Get the song data for the other MIDI instruments.
	var songData = getSongDataForMidiInstruments(allInstrumentsWithoutSelected);
	//post("[compose.js] Song data: " + JSON.stringify(songData) + "\n");

	// Create the command parameters.
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
}


function executeClearAllCommand() {

	// For each track, get the clips and delete them.
	var trackNames = config["trackNames"];
	for (var i = 0; i < trackNames.length; i++) {
		executeClearTrackCommand(trackNames[i]);
	}

}


function executeClearTrackCommand(trackName) {

	if (trackName == null) {
		var selectedInstrument = this.patcher.getnamed("selectedInstrument").getvalueof();
		var selectedInstrumentName = config["instruments"][selectedInstrument];
		var selectedInstrumentMidi = config["instrumentsToMidi"][selectedInstrumentName];
		trackName = config["midiToTrackNames"][selectedInstrumentMidi];
	}
	post("[compose.js] Clearing track: " + trackName + "\n");

	// Get the track index.
	var trackIndex = getTrackIndexWithName(trackName);
	if (trackIndex == -1) {
		post("Track not found: " + trackName + "\n");
		return;
	}

	// Get the clips of the track.
	var clipIndices = getArrangementClipIndices(trackIndex);
	clipIndices = sortClipIndicesByPosition(trackIndex, clipIndices);
	post("Clips: " + clipIndices + "\n");

	// Delete all notes from the clips.
	for (var i = 0; i < clipIndices.length; i++) {
		var clipIndex = clipIndices[i];
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
		clip.call("remove_notes_extended", 0, 128, 0, 128);
	}

}


function getSelectedInstrumentMidi() {

	//var config = getConfig();
	var instruments = config["instruments"];
	var instrumentsToMidi = config["instrumentsToMidi"];

	// Read the dropdown "selectedInstrument" from the Max patch.
    var selectedInstrument = this.patcher.getnamed("selectedInstrument").getvalueof();
    var selectedInstrumentName = instruments[selectedInstrument];
    var selectedInstrumentMidi = instrumentsToMidi[selectedInstrumentName];
	return selectedInstrumentMidi;
}

function getSongDataForMidiInstruments(midiInstruments) {
	
	var songData = {
		"tracks": []
	}

	for (var i = 0; i < midiInstruments.length; i++) {
		var midiInstrument = midiInstruments[i];
		var trackData = getTrackDataForMidiInstrument(midiInstrument);
		var isEmpty = false;
		for (var j = 0; j < trackData["bars"].length; j++) {
			if (trackData["bars"][j]["notes"].length == 0) {
				isEmpty = true;
				break;
			}
		}
		if (!isEmpty) {
			songData["tracks"].push(trackData);
		}
		else {
			post("[compose.js] Track is empty: " + midiInstrument + "\n");
		}
	}

	return songData;

}

function getTrackDataForMidiInstrument(midiInstrument) {

	// Get the track index.
	var trackName = config["midiToTrackNames"][midiInstrument];
	post("[compose.js] Track name: " + trackName + "\n");
	var trackIndex = getTrackIndexWithName(trackName);
	post("[compose.js] Track index: " + trackIndex + "\n");

	// Get the clips of the track.
	var clipIndices = getArrangementClipIndices(trackIndex);
	clipIndices = sortClipIndicesByPosition(trackIndex, clipIndices);
	post("[compose.js] Clips: " + clipIndices + "\n");

	// Get the track.
	var trackData = {
		"instrument": midiInstrument,
		"bars": [],
		"enabled": true
	};

	// Iterate through the clips and get the bars.
	for (var i = 0; i < 4; i++) {
		var clipIndex = clipIndices[i];
		var barData = getBarDataFromClip(trackIndex, clipIndex);
		trackData["bars"].push(barData);
	}

	// Done.
	return trackData;
}


function getBarDataFromClip(trackIndex, clipIndex) {
	
	// Get the clip.
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);

	// Get the notes from the clip.
	var notes = clip.call("get_notes_extended", 0, 128, 0, 128);
	notes = JSON.parse(notes);
	post("[compose.js] Notes: " + notes + " " + typeof notes +  "\n");

	var barData = notesToBarData(notes);
	return barData;
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

	// Get the config object.
	var config = getConfig();

	// Get the track data from the result object. It is the last one.
	var songData = result["result"]["song_data"];
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

	// Get the clips of the track.
	var trackIndex = getTrackIndexWithName(trackName);
	if (trackIndex == -1) {
		post("Track not found: " + trackName + "\n");
		return;
	}
	post("Track index: " + trackIndex + "\n");
	var clipIndices = getArrangementClipIndices(trackIndex);
	clipIndices = sortClipIndicesByPosition(trackIndex, clipIndices);
	post("Clips: " + clipIndices + "\n");

	// Insert the bars into the clips.
	for (var i = 0; i < 4; i++) {
		var barData = bars[i];
		var clipIndex = clipIndices[i];
		insertBarIntoClip(barData, trackIndex, clipIndex);
	}
}


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


function insertBarIntoClip(barData, trackIndex, clipIndex) {
	post("Inserting bar into track " + trackIndex + " clip " + clipIndex + "\n");

	// Get the clip.
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);

	// Convert the track data to notes.
	var notes = barDataToNotes(barData);
	post("Notes: ", notes, "\n");

	// Delete all notes and add the new notes.
	clip.call("remove_notes_extended", 0, 128, 0, 128);
	clip.call("add_new_notes", notes);

}	

function barDataToNotes(barData) {

	// Get the BPM.
	var bpm = getBpm();

	// Create the notes object.
	var notes = {
		"notes": []
	}

	// The track data has a "notes" array. Iterate through the notes and add the notes to the notes object.
	for (var i = 0; i < barData["notes"].length; i++) {
		var noteData = barData["notes"][i];
		var noteStart = noteData["start"];
		var noteEnd = noteData["end"];
		var notePitch = noteData["note"];
		var noteVelocity = 80;

		// Convert the note start and end times to seconds.
		noteStart = convertTimeToSeconds(noteStart, bpm);
		noteEnd = convertTimeToSeconds(noteEnd, bpm);

		// Add the note to the notes object.
		var note = {
			"pitch": notePitch,
			"start_time": noteStart,
			"duration": noteEnd - noteStart,
			"velocity": noteVelocity,
			"mute": 0
		}
		notes["notes"].push(note);
	}

	return notes;
}

function notesToBarData(notes) {

	// Get the BPM.
	var bpm = getBpm();

	var barData = {
		"notes": []
	}

	for (var i = 0; i < notes["notes"].length; i++) {
		var note = notes["notes"][i];
		var noteData = {
			"start": convertTimeToBeats(note["start_time"], bpm),
			"end": convertTimeToBeats(note["start_time"] + note["duration"], bpm),
			"note": note["pitch"]
		}
		barData["notes"].push(noteData);
	}

	return barData;

}


function getBpm() {
	// Get the beats per minute. From the LiveAPI.
	var api = new LiveAPI("live_set");
	var bpm = api.get("tempo");
	return bpm;
}


function convertTimeToSeconds(timeInBeats, bpm) {
    // Time in beats is in 32nd notes resolution.
    return timeInBeats * (60 / bpm) / 4;
}


function convertTimeToBeats(timeInSeconds, bpm) {
	// Round to the nearest 32nd note.
	var beats = timeInSeconds * 4 / (60 / bpm);
	return Math.round(beats * 32) / 32;
}