autowatch = 1;
inlets = 2;
outlets = 1;

// Load the config.
config = getConfig();

// This is the entry point for the script.
function bang() {
	// Relay the command.
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

	// Get the loop info in beats.
	var loopInfoBeats = getLoopInfoBeats();
	var startBeat = loopInfoBeats.loopStartBeats;
	//var lengthBeats = loopInfoBeats.loopLengthBeats;
	var lengthBeats = 16;
	post("[compose.js] Loop start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

	// Get all the AI tracks.
	var aiTracksIndices = getAiTracksIndices();
	if (aiTracksIndices.length == 0) {
		logMessage("No AI tracks found.");
		return;
	}

	// Get the index of the selected AI track.
	var selectedTrackIndices = getSelectedAiTrackIndices();
	if (selectedTrackIndices.length == 0) {
		logMessage("No AI tracks selected.");
		return;
	}
	if (selectedTrackIndices.length > 1) {
		logMessage("More than one AI track selected.");
		return;
	}

	// Get the AI tracks that are not selected.
	var aiTracksNotSelected = aiTracksIndices.filter(function(value, index, arr) {
		return selectedTrackIndices.indexOf(value) == -1;
	});

	post("[compose.js] Selected AI track index: " + selectedTrackIndices[0] + " all: " + aiTracksIndices + "\n");
	post("[compose.js] AI tracks not selected: " + aiTracksNotSelected + "\n");

	// Only use the first AI track.
	var trackIndex = selectedTrackIndices[0];
	var trackName = new LiveAPI("live_set tracks " + trackIndex).get("name").toString();
	post("[compose.js] Selected track name: " + trackName + "\n");

	// Get the selected instrument MIDI.
	var instrument = getInstrumentFromTrackName(trackName);
	post("[compose.js] Selected instrument MIDI: " + instrument + "\n");

	// Get the selected genre.
	var genre = getSelectedGenre();
	post("[compose.js] Selected genre: " + genre + "\n");

	// Get the temperature.
	var temperature = getTemperature();
	post("[compose.js] Temperature: " + temperature + "\n");

	// Get the song data for the other instruments.
	var songData = getSongDataFromTrackIndices(aiTracksNotSelected, startBeat, lengthBeats);

	// Create the command parameters.
	var parameters = {
		"instrument": instrument,
		"genre": genre,
		"density": 4,
		"temperature": temperature,
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

	var arguments = {
		"trackIndex": trackIndex,
		"startBeat": startBeat,
		"lengthBeats": lengthBeats
	};

	// Post the command.
	postCommand(command, arguments);

}

function postCommand(command, callArguments) {

    var url = "http://127.0.0.1:5885/api/command";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    //Send the proper header information along with the request and add the command as a JSON string payload.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
			var responseJSON = JSON.parse(xhr.responseText);
			var result = {
				"command": command,
				"arguments": callArguments,
				"result": responseJSON
			};
			postCommandResponse(result);
        }
    }.bind(this);
    xhr.send(JSON.stringify(command));

}

function getAiTracksIndices() {

	// Get the infix to identify AI tracks.
	var infix = config.aiInstrumentInfix;

	// Get all tracks from the LiveAPI.
	var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");

	// Get the AI tracks.
	var aiTracksIndices = [];

	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		var trackName = track.get("name").toString();
		if (trackName.indexOf(infix) != -1) {
			aiTracksIndices.push(i);
		}
	}

	return aiTracksIndices;

}

function getSelectedAiTrackIndices() {

	// Get the infix to identify AI tracks.
	var infix = config.aiInstrumentInfix;

	// Get the selected track.
	var selectedTrack = new LiveAPI("live_set view selected_track");
	var trackName = selectedTrack.get("name").toString();
	var trackId = selectedTrack.id;

	// Check if the track is an AI track.
	if (trackName.indexOf(infix) == -1) {
		return [];
	}

	// Get the index of the selected track.
	var trackIndex = getTrackIndexFromId(trackId);
	if (trackIndex == -1) {
		return [];
	}
	return [trackIndex];
}


function getTrackIndexFromId(trackId) {
	var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");
	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		if (track.id == trackId) {
			return i;
		}
	}
	return -1;
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

	var instruments = config["instruments"];
	var instrumentsToMidi = config["instrumentsToMidi"];

	// Read the dropdown "selectedInstrument" from the Max patch.
    var selectedInstrument = this.patcher.getnamed("selectedInstrument").getvalueof();
    var selectedInstrumentName = instruments[selectedInstrument];
    var selectedInstrumentMidi = instrumentsToMidi[selectedInstrumentName];
	return selectedInstrumentMidi;
}


function getSelectedGenre() {
	// SelectedGenre is a umenu.
	var selectedGenreSlider = this.patcher.getnamed("selectedGenre");

	// Get the genre name from the config.
	var genreItems = selectedGenreSlider.getattr("items")

	// Get and return the selected genre.
	var selectedGenreIndex = selectedGenreSlider.getvalueof();
	var selectedGenre = genreItems[selectedGenreIndex * 2];
	return selectedGenre;
}


function getTemperature() {

	// Object is temperatureSlider.
	var temperatureSlider = this.patcher.getnamed("temperatureSlider");

	// Get the value of the slider.
	var temperature = temperatureSlider.getvalueof();

	return parseFloat(temperature);
}

function getSongDataFromTrackIndices(trackIndices, startBeat, lengthBeats) {
	
	post("[compose.js] Getting song data from track indices " + trackIndices + " start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

	var songData = {
		"tracks": []
	}

	for (var i = 0; i < trackIndices.length; i++) {
		var trackIndex = trackIndices[i];
		var trackName = new LiveAPI("live_set tracks " + trackIndex).get("name").toString();
		var midiInstrument = getInstrumentFromTrackName(trackName);
		var trackData = getTrackDataForIndex(trackIndex, startBeat, lengthBeats);
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

	// Print as JSON.
	post("[compose.js] Song data: " + JSON.stringify(songData) + "\n");

	return songData;
}


function getTrackDataForIndex(trackIndex, startBeat, lengthBeats) {

	// Get the track.
	var track = new LiveAPI("live_set tracks " + trackIndex);
	var trackName = track.get("name").toString();

	// Get the instrument.
	var instrument = getInstrumentFromTrackName(trackName);
	post("[compose.js] Track name: " + trackName + " instrument: " + instrument + "\n");

	// Get the clips of the track.
	//var clipsInRangeIndices = getArrangementClipsInRangeIndices(trackIndex, startBeat, lengthBeats);
	
	//if (clipsInRangeIndices.length != 1) {
	//	throw "There are no clips in the range.";
	//}

	// Get the track.
	var trackData = {
		"instrument": instrument,
		"bars": [],
		"enabled": true
	};

	for (var barIndex = 0; barIndex < 4; barIndex++) {
		post("[compose.js] Getting bar data for track " + trackIndex + " bar " + barIndex + "\n");


		// Create empty bar data.
		var barData = {
			"notes": []
		};

		// Get the start beat of the bar.
		var beatsStart = startBeat + barIndex * 4;
		var beatsLength = 4;

		// Go through the clips.
		var clipsNumber = new LiveAPI("live_set tracks " + trackIndex).getcount("arrangement_clips");

		for (var clipIndex = 0; clipIndex < clipsNumber; clipIndex++) {
			var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
			var clipStart = parseInt(clip.get("start_time"));

			// Make beatsStart relative to the clip.
			var beatsStartRelative = beatsStart - clipStart;

			// Get the notes from the clip.
			var notes = clip.call("get_notes_extended", 0, 128, beatsStartRelative, beatsLength);
			notes = JSON.parse(notes);

			// Add the notes to the bar data.
			var notesArray = notes["notes"];
			for (var i = 0; i < notesArray.length; i++) {
				var note = notesArray[i];
				var start = note["start_time"] - beatsStartRelative;
				var end = note["start_time"] + note["duration"] - beatsStartRelative;
				start = start * 8;
				end = end * 8;
				var noteData = {
					"start": start,
					"end": end,
					"note": note["pitch"]
				}
				barData["notes"].push(noteData);
			}



			// Post how many notes were found.
			post("[compose.js] Notes found: " + notes["notes"].length + "\n");
		}

		// Add the bar data to the track data.
		trackData["bars"].push(barData);
	}

	// Iterate through the clips and get the bars.
	// TODO Make this work for the range.
	//for (var i = 0; i < 4; i++) {
	//	var clipIndex = clipIndices[i];
	//	var barData = getBarDataFromClip(trackIndex, clipIndex);
	//	trackData["bars"].push(barData);
	//}

	// Done.
	return trackData;
}


function getInstrumentFromTrackName(trackName) {
	var infix = config["aiInstrumentInfix"];
	var instrument = trackName.split(infix)[1];
	var instrumentsToMidi = config["instrumentsToMidi"];
	instrument = instrumentsToMidi[instrument];
	return instrument;
}


function getBarDataFromClip(trackIndex, clipIndex) {
	throw "I think I can remove this. I might be wrong."
	
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
		var trackIndex = result.arguments.trackIndex;
		var startBeat = result.arguments.startBeat;
		var lengthBeats = result.arguments.lengthBeats;
		handleAddInstrumentResult(result, trackIndex, startBeat, lengthBeats);
	}
	else {
		post("Unknown command name: " + commandName + "\n");
	}

}

function handleAddInstrumentResult(result, trackIndex, startBeat, lengthBeats) {
	post("[compose.js] Handling addinstrument result.\n");

	// Get the config object.
	var config = getConfig();

	// Get the track data from the result object. It is the last one.
	var songData = result["result"]["song_data"];
	var tracks = songData["tracks"];
	var track = tracks[tracks.length - 1];

	// Get the bars of the track.
	var bars = track["bars"];
	post("Bars: " + bars.length + "\n");

	// Get all arrangement clips.
	//var clipsInRangeIndices = getArrangementClipsInRangeIndices(trackIndex, startBeat, lengthBeats);
	//post("Clips in range: " + clipsInRangeIndices.length + "\n");
	//if (clipsInRangeIndices.length == 0) {
	//	throw "There must be at least one clip in the range.";
	//}

	// Get the number of arrangement clips in the track.
	var numberOfArrangementClipsInTrack = new LiveAPI("live_set tracks " + trackIndex).getcount("arrangement_clips");
	post("Number of arrangement clips in track: " + numberOfArrangementClipsInTrack + "\n");

	// Go through the bars.
	var insertionData = [];
	for (var i = 0; i < bars.length; i++) {
		var barStartBeats = startBeat + i * 4;
		var barLengthBeats = 4;
		post("Bar index: " + i + " start: " + barStartBeats + " length: " + barLengthBeats + "\n");
		var barData = bars[i];
		var barPositionInLoopBeats = i * 4 + startBeat;
		post("Bar position in loop: " + barPositionInLoopBeats + "\n");

		// Find the first clip that intersects with the bar.
		var inserted = false;
		for (var clipIndex = 0; clipIndex < numberOfArrangementClipsInTrack; clipIndex++) {
			var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
			var clipStartTime = parseInt(clip.get("start_time"));
			var clipLength = parseInt(clip.get("length"));
			if (clipStartTime <= barStartBeats && clipStartTime + clipLength >= barStartBeats + barLengthBeats) {
				var offsetInClipInBeats = barPositionInLoopBeats - clipStartTime;
				post("Inserting bar into clip: " + clipIndex + " offset: " + offsetInClipInBeats + "\n");
				insertionData.push([clipIndex, barData, offsetInClipInBeats]);
				inserted = true;
				post("\n");
				break;
			}
		}
		if (!inserted) {
			post("No clip found for bar.\n");
		}

	}

	// Get the clip indices and make them unique.
	var clipIndices = insertionData.map(function(value, index, arr) {
		return value[0];
	});
	post("Clip indices: " + clipIndices + "\n");

	// Clear the clips.
	clearClips(trackIndex, clipIndices);

	// Insert the bars into the clips.
	for (var i = 0; i < insertionData.length; i++) {
		var data = insertionData[i];
		var clipIndex = data[0];
		var barData = data[1];
		var offsetInClipInBeats = data[2];
		insertBarIntoClip(barData, trackIndex, clipIndex, offsetInClipInBeats);
	}
}


function clearClips(trackIndex, clipIndices) {
	for (var i = 0; i < clipIndices.length; i++) {
		var clipIndex = clipIndices[i];
		clearClip(trackIndex, clipIndex);
	}
}


function clearClip(trackIndex, clipIndex) {
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
	clip.call("remove_notes_extended", 0, 128, 0, 128);
}


function getArrangementClipsInRangeIndices(trackIndex, startBeat, lengthBeats) {
	throw "I think I can remove this. I might be wrong.";

	post("Getting clips in range for track " + trackIndex + " start: " + startBeat + " length: " + lengthBeats + "\n");
	var track = new LiveAPI("live_set tracks " + trackIndex);
	var arrangementClipsCount = track.getcount("arrangement_clips");
	var clipsInRangeIndices = [];
	for (var i = 0; i < arrangementClipsCount; i++) {
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + i);
		var clipStartMarker = clip.get("start_marker");
		var clipEndMarker = clip.get("end_marker");
		post("Clip start: " + clipStartMarker + " end: " + clipEndMarker + "\n");
		if (clipStartMarker >= startBeat && clipEndMarker <= startBeat + lengthBeats) {
			clipsInRangeIndices.push(i);
		}
	}
	return clipsInRangeIndices;
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
	throw "I think I can remove this. I might be wrong.";
	var track = new LiveAPI("live_set tracks " + trackIndex);
	var arrangementClipsCount = track.getcount("arrangement_clips");
	var arrangementClipsIndices = [];
	for (var i = 0; i < arrangementClipsCount; i++) {
		arrangementClipsIndices.push(i);
	}
	return arrangementClipsIndices;
}


function sortClipIndicesByPosition(trackIndex, clipIndices) {
	throw "I think I can remove this. I might be wrong.";

	var track = new LiveAPI("live_set tracks " + trackIndex);
	clipIndices.sort(function(a, b) {
		var clipA = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + a);
		var clipB = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + b);
		return clipA.get("position") - clipB.get("position");
	});
	return clipIndices;
}


function insertBarIntoClip(barData, trackIndex, clipIndex, offsetInClipInBeats) {
	post("Inserting bar into track " + trackIndex + " clip " + clipIndex + " offset: " + offsetInClipInBeats + "\n");

	// Get the clip.
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);

	var barIndex = offsetInClipInBeats / 4;
	post("Bar index: " + barIndex + "\n");

	// Get the notes from the clip.
	var notes = barDataToNotes(barIndex, barData);

	// Get the starting times.
	//var notesArray = notes["notes"];
	//var startingTimes = notesArray.map(function(value, index, arr) {
	//	return value["start_time"];
	//});
	//post("Starting times: " + startingTimes + "\n");

	clip.call("add_new_notes", notes);

}

function insertBarsIntoClip(barDataList, trackIndex, clipIndex) {
	throw "I thought I could remove this. I might be wrong.";
	post("Inserting bar into track " + trackIndex + " clip " + clipIndex + "\n");

	// Get the clip.
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);

	// Delete all notes and add the new notes.
	clip.call("remove_notes_extended", 0, 128, 0, 128);

	for (var barIndex = 0; barIndex < barDataList.length; barIndex++) {
		var notes = barDataToNotes(barIndex, barDataList[barIndex]);
		clip.call("add_new_notes", notes);
	}

}	


function barDataToNotes(barIndex, barData) {

	// Get the BPM.
	//var bpm = getBpm();

	// Create the notes object.
	var notes = {
		"notes": []
	}

	var barOffset = barIndex * 32;
	post("Bar offset: " + barOffset + "\n");

	// The track data has a "notes" array. Iterate through the notes and add the notes to the notes object.
	for (var i = 0; i < barData["notes"].length; i++) {
		var noteData = barData["notes"][i];
		var noteStart = noteData["start"] + barOffset;
		var noteEnd = noteData["end"] + barOffset;
		var notePitch = noteData["note"];
		var noteVelocity = 80;

		// Convert the note start and end times to seconds.
		//noteStart = convertTimeToSeconds(noteStart, bpm);
		//noteEnd = convertTimeToSeconds(noteEnd, bpm);

		noteStart = noteStart / 8;
		noteEnd = noteEnd / 8;

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

	throw "I must fix this. It uses BPM, but it should use beats.";

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
	throw "I strongly believe, this can go. Everything is in beats now.";

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


function getLoopInfoBeats() {
    // Get the live set object.
    var liveSet = new LiveAPI("live_set");

    // Get the loop property.
    var loopActive = liveSet.get("loop");
    var loopStartBeats = liveSet.get("loop_start");
    var loopLengthBeats = liveSet.get("loop_length");
    return {
        loopActive: loopActive,
        loopStartBeats: parseInt(loopStartBeats),
        loopLengthBeats: parseInt(loopLengthBeats)
    };
}

function logMessage(message) {
	var messageLog = this.patcher.getnamed("messageLog");
	messageLog.set(message);
	post("[compose.js] " + message + "\n");
}


function assert(condition, message) {
	if (!condition) {
		throw message;
	}
}