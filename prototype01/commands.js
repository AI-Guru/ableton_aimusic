autowatch = 1;
inlets = 1;
outlets = 1;

// Load the config.
config = getConfig();

logLevel = "debug";


function loadbang() {
	clearMessage();
	log("info", "Command.js loaded.\n");
}

function log(messageLogLevel, message) {
	var allLogLevels = ["error", "warning", "info", "debug"];
	if (allLogLevels.indexOf(messageLogLevel) == -1) {
		raise;
	}

	var visibleLogLevels = [];
	if (logLevel == "info") {
		visibleLogLevels = ["info", "error"];
	}
	else if (logLevel == "debug") {
		visibleLogLevels = ["info", "debug", "error"];
	}
	if (visibleLogLevels.indexOf(messageLogLevel) != -1) {
		post("[command.js]" + messageLogLevel + ": " + message);
	}
}



// Execute the command.
function executeCommand(commandName) {

	log("debug", "Executing command: " + commandName + "\n");
	disableUndo();
	clearMessage();
	if (commandName == "addinstrument") {
		executeAddInstrumentCommand();
	}
	else if (commandName == "fillup") {
		executeFillUpCommand();
	}
	else if (commandName == "clearall") {
		executeClearAllCommand();
	}
	else if (commandName == "cleartrack") {
		executeClearTrackCommand();
	}
	else {
		log("error", "Unknown command: " + commandName + "\n");
	}
	enableUndo();
}


function executeAddInstrumentCommand() {

	// Get the loop info in beats.
	var loopInfoBeats = getLoopInfoBeats();
	var startBeat = loopInfoBeats.loopStartBeats;
	var lengthBeats = 16;
	//log("debug", "Loop start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

	// Get all the AI tracks.
	var aiTracksIndices = getAiTracksIndices();
	if (aiTracksIndices.length == 0) {
		displayMessage("No AI tracks found! Please toggle one.");
		return;
	}
    //log("debug", "AI tracks found: " + aiTracksIndices + "\n");

	// Get the index of the selected AI track.
	var selectedTrackIndices = getSelectedAiTrackIndices();
	if (selectedTrackIndices.length == 0) {
		displayMessage("No AI tracks selected.");
		return;
	}
	if (selectedTrackIndices.length > 1) {
		log("error", "More than one AI track selected.");
		return;
	}

	// Get the AI tracks that are not selected.
	var aiTracksNotSelected = aiTracksIndices.filter(function(value, index, arr) {
		return selectedTrackIndices.indexOf(value) == -1;
	});

	//log("debug", "Selected AI track index: " + selectedTrackIndices[0] + " all: " + aiTracksIndices + "\n");
	//log("debug", "AI tracks not selected: " + aiTracksNotSelected + "\n");

	// Only use the first AI track.
	var trackIndex = selectedTrackIndices[0];
	var trackName = new LiveAPI("live_set tracks " + trackIndex).get("name").toString();
	//log("debug", "Selected track name: " + trackName + "\n");

	// Get the selected instrument MIDI.
	var instrument = getInstrumentFromTrackName(trackName);
	//log("debug", "Selected instrument MIDI: " + instrument + "\n");

	// Get the selected genre.
	var genre = getSelectedGenre();
	//log("debug", "Selected genre: " + genre + "\n");

	// Get the temperature.
	var temperature = getTemperature();
	//log("debug", "Temperature: " + temperature + "\n");

	// Get the density.
	var density = getDensity();
	//log("debug", "Density: " + density + "\n");

	// Get the selected model.
	var model = getModel();
	//log("debug", "Model: " + model + "\n");

	// Get the API token.
	var apiToken = getApiToken();
	//log("debug", "API token: " + apiToken + "\n");

	// Get the harmony mode.
	var harmonyMode = getHarmonyMode();
	//log("debug", "Harmony mode: " + harmonyMode + "\n");

	// Get the notes.
	var notes = getNotes();
	//log("debug", "Notes: " + notes + "\n");

	// Get the song data for the other instruments.
	var songData = getSongDataFromTrackIndices(aiTracksNotSelected, startBeat, lengthBeats, true);

	// Create the command parameters.
	var parameters = {
		"instrument": instrument,
		"genre": genre,
		"density": density,
		"temperature": temperature,
		"model": model,
		"harmonymode": harmonyMode,
		"instrumentmode": "full",
		"selectednotes": notes,
		"synthesize": false,
	}

	var command = {
		"command": "addinstrument",
		"data": songData,
		"parameters": parameters,
		"apitoken": apiToken
	};

	var arguments = {
		"trackIndex": trackIndex,
		"startBeat": startBeat,
		"lengthBeats": lengthBeats
	};

	// Post the command.
	postCommand(command, arguments);

}


function executeFillUpCommand() {

	// Get the loop info in beats.
	var loopInfoBeats = getLoopInfoBeats();
	var startBeat = loopInfoBeats.loopStartBeats;
	var lengthBeats = loopInfoBeats.loopLengthBeats;
	//log("debug", "Loop start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

	// Get all the AI tracks.
	var aiTracksIndices = getAiTracksIndices();
	if (aiTracksIndices.length == 0) {
		displayMessage( "No AI tracks found! Please toggle one.");
		return;
	}
    //log("debug", "AI tracks found: " + aiTracksIndices + "\n");

	// Get the selected genre.
	var genre = getSelectedGenre();
	//log("debug", "Selected genre: " + genre + "\n");

	// Get the temperature.
	var temperature = getTemperature();
	//log("debug", "Temperature: " + temperature + "\n");

	// Get the density.
	var density = getDensity();
	//log("debug", "Density: " + density + "\n");

	// Get the selected model.
	var model = getModel();
	//log("debug", "Model: " + model + "\n");

	var apiToken = getApiToken();
	//log("debug", "API token: " + apiToken + "\n");

	// Get the harmony mode.
	var harmonyMode = getHarmonyMode();
	//log("debug", "Harmony mode: " + harmonyMode + "\n");

	// Get the notes.
	var notes = getNotes();
	//log("debug", "Notes: " + notes + "\n");

	// Get the song data for the instruments.
	var songData = getSongDataFromTrackIndices(aiTracksIndices, startBeat, lengthBeats, false);
	//log("debug", "Song data ready.\n");

	// Create the command parameters.
	var parameters = {
		"genre": genre,
		"density": density,
		"temperature": temperature,
		"model": model,
		"harmonymode": harmonyMode,
		"instrumentmode": "full",
		"selectednotes": notes,
		"synthesize": false,
	}

	var command = {
		"command": "fillup",
		"data": songData,
		"parameters": parameters,
		"apitoken": apiToken
	};

	var arguments = {
		"startBeat": startBeat,
		"lengthBeats": lengthBeats
	};

	// Post the command.
	postCommand(command, arguments);

}


function postCommand(command, callArguments) {

	var url = getApiUrl();

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    //Send the proper header information along with the request and add the command as a JSON string payload.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
			try {
				var responseJSON = JSON.parse(xhr.responseText);
				var result = {
					"command": command,
					"arguments": callArguments,
					"result": responseJSON
				};
				try {
					postCommandResponse(result);
				}
				catch (error) {
					log("error", "Could not process result." + error + "\n");
					displayMessage("Could not process result.");
				}
			}
			catch (error) {
				displayMessage("1 Error: Could not communicate with server.");
			}
        }
		else {
			displayMessage("2 Error: " + xhr.statusText + "\n");
		}
    }.bind(this);
    xhr.send(JSON.stringify(command));

}

function getAiTracksIndices() {

	// Get the infix to identify AI tracks.
	var infix = getConfig().aiInstrumentInfix;

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
	var infix = getConfig().aiInstrumentInfix;

	// If the infix is undefined, post an error message and return an empty array.
	if (infix == null) {
		log("error", "Infix is undefined.\n");
		return [];
	}

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
	var trackNames = getConfig()["trackNames"];
	for (var i = 0; i < trackNames.length; i++) {
		executeClearTrackCommand(trackNames[i]);
	}

}


function executeClearTrackCommand(trackName) {

	if (trackName == null) {
		var selectedInstrument = this.patcher.getnamed("selectedInstrument").getvalueof();
		var selectedInstrumentName = getConfig()["instruments"][selectedInstrument];
		var selectedInstrumentMidi = getConfig()["instrumentsToMidi"][selectedInstrumentName];
		trackName = getConfig()["midiToTrackNames"][selectedInstrumentMidi];
	}
	//log("debug", "Clearing track: " + trackName + "\n");

	// Get the track index.
	var trackIndex = getTrackIndexWithName(trackName);
	if (trackIndex == -1) {
		log("error", "Track not found: " + trackName + "\n");
		return;
	}

	// Get the clips of the track.
	var clipIndices = getArrangementClipIndices(trackIndex);
	clipIndices = sortClipIndicesByPosition(trackIndex, clipIndices);
	//log("debug", "Clips: " + clipIndices + "\n");

	// Delete all notes from the clips.
	for (var i = 0; i < clipIndices.length; i++) {
		var clipIndex = clipIndices[i];
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
		clip.call("remove_notes_extended", 0, 128, 0, 128);
	}

}


function getSelectedInstrumentMidi() {

	var instruments = getConfig()["instruments"];
	var instrumentsToMidi = getConfig()["instrumentsToMidi"];

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

function getDensity() {

	// Object is densitySlider.
	var densitySlider = this.patcher.getnamed("densitySlider");

	// Get the value of the slider.
	var density = densitySlider.getvalueof();

	return parseInt(density);
}

function getModel() {

	var selectedModelObject = this.patcher.getnamed("selectedModel");

	// Get the genre name from the config.
	var modelItems = selectedModelObject.getattr("items")

	// Get and return the selected genre.
	var selectedModelIndex = selectedModelObject.getvalueof();
	var selectedModel = modelItems[selectedModelIndex * 2];
	return selectedModel;
}

function getHarmonyMode() {
	var object = this.patcher.getnamed("noteMode");

	var selectedIndex = object.getvalueof();
	if (selectedIndex == 0) {
		return "polyphone";
	}
	else {
		return "monophone";
	}
}

function getApiUrl() {

	// There is a radio button group called "apiSource".
	var apiSourceObject = this.patcher.getnamed("apiMode");

	// Get the value of the radio button group.
	var apiSource = apiSourceObject.getvalueof();

	// Get the URL from the config.
	if (apiSource == 0) {
		var url = getConfig()["apiUrlRemote"];
	}
	else if (apiSource == 1) {
		var url = getConfig()["apiUrlLocal"];
	}
	else {
		throw "Unknown API source.";
	}
	return url;
}


function getApiToken() {
	var apiTokenObject = this.patcher.getnamed("apiTokenField");
	var apiToken = apiTokenObject.getvalueof();
	// Map to string.
	apiToken = apiToken.toString();
	return apiToken;
}


function getNotes() {

	var liveSet = new LiveAPI("live_set");
	var scaleMode = liveSet.get("scale_mode");
	var allNotes = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];

	if (scaleMode == 0) {
		return allNotes;
	}
	else {
		var rootNote = parseInt(liveSet.get("root_note"));
		var scaleIntervals = liveSet.get("scale_intervals");
		var scaleNotes = [];
		for (var i = 0; i < scaleIntervals.length; i++) {
			var scaleInterval = scaleIntervals[i];
			var index = (rootNote + scaleInterval) % 12;
			var note = allNotes[index];
			scaleNotes.push(note);
		}
		return scaleNotes;
	}

}

function getSongDataFromTrackIndices(trackIndices, startBeat, lengthBeats, ignoreEmptyTracks) {
	
	//log("debug", "Getting song data from track indices " + trackIndices + " start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

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
		if (!isEmpty || !ignoreEmptyTracks) {
			songData["tracks"].push(trackData);
		}
		else {
			//log("debug", "Track is empty: " + midiInstrument + "\n");
		}
	}

	return songData;
}


function getTrackDataForIndex(trackIndex, startBeat, lengthBeats) {

	// Get the track.
	var track = new LiveAPI("live_set tracks " + trackIndex);
	var trackName = track.get("name").toString();

	// Get the instrument.
	var instrument = getInstrumentFromTrackName(trackName);
	//log("debug", "Track name: " + trackName + " instrument: " + instrument + "\n");

	// Get the track.
	var trackData = {
		"instrument": instrument,
		"bars": [],
		"enabled": true
	};

	for (var barIndex = 0; barIndex < lengthBeats / 4; barIndex++) {
		//log("debug", "Getting bar data for track " + trackIndex + " bar " + barIndex + "\n");

		// Create empty bar data.
		var barData = {
			"notes": [],
			"noclip": false
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
		}

		// If the bar is empty, check if there is a clip that intersects with the bar at all.
		var isEmpty = barData["notes"].length == 0;
		if (isEmpty) {
			for (var clipIndex = 0; clipIndex < clipsNumber; clipIndex++) {
				var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
				var clipStart = parseInt(clip.get("start_time"));
				var clipLength = parseInt(clip.get("length"));
				if (clipStart <= beatsStart && clipStart + clipLength >= beatsStart + beatsLength) {
					isEmpty = false;
					break;
				}
			}
		}

		// If the bar is still empty, set the noclip flag.
		if (isEmpty) {
			//log("debug", "Bar is empty: " + barIndex + "\n");
			barData["noclip"] = true;
		}

		// Add the bar data to the track data.
		trackData["bars"].push(barData);
	}

	// Done.
	return trackData;
}


function getInstrumentFromTrackName(trackName) {
	var infix = getConfig()["aiInstrumentInfix"];
	var instrument = trackName.split(infix)[1];
	var instrumentsToMidi = getConfig()["instrumentsToMidi"];
	instrument = instrumentsToMidi[instrument];
	return instrument;
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

	log("debug", "Post command response received.\n");
	//log("debug", "Result: " + JSON.stringify(result) + "\n");

	// Handle errors.
	if (result.result.error) {
		displayMessage("3. Error: " + result.result.error);
		return;
	}

	// Get the command name from the result object.
	var commandName = result.command.command;
	if (commandName == "addinstrument") {
		var trackIndex = result.arguments.trackIndex;
		var startBeat = result.arguments.startBeat;
		var lengthBeats = result.arguments.lengthBeats;
		handleAddInstrumentResult(result, trackIndex, startBeat, lengthBeats);
	}
	else if (commandName == "fillup") {
		var startBeat = result.arguments.startBeat;
		var lengthBeats = result.arguments.lengthBeats;
		handleFillUpResult(result, startBeat, lengthBeats);
	}
	else {
		log("error", "Unknown command in result: " + commandName + "\n");
	}

}

function handleAddInstrumentResult(result, trackIndex, startBeat, lengthBeats) {
	//log("debug", "Handling addinstrument result.\n");

	// Get the track data from the result object. It is the last one.
	var songData = result["result"]["song_data"];
	var tracks = songData["tracks"];
	var track = tracks[tracks.length - 1];

	// Get the bars of the track.
	var bars = track["bars"];
	//log("debug", "Bars: " + bars.length + "\n");

	// Get the number of arrangement clips in the track.
	var numberOfArrangementClipsInTrack = new LiveAPI("live_set tracks " + trackIndex).getcount("arrangement_clips");
	//log("debug", "Number of arrangement clips in track: " + numberOfArrangementClipsInTrack + "\n");

	// Go through the bars.
	var insertionData = [];
	for (var barIndex = 0; barIndex < bars.length; barIndex++) {
		var barStartBeats = startBeat + barIndex * 4;
		var barLengthBeats = 4;
		//log("debug", "Bar index: " + barIndex + " start: " + barStartBeats + " length: " + barLengthBeats + "\n");
		var barData = bars[barIndex];
		var barPositionInLoopBeats = barIndex * 4 + startBeat;
		//log("debug", "Bar position in loop: " + barPositionInLoopBeats + "\n");

		// Find the first clip that intersects with the bar.
		var offsetInClipInBeats = startBeat + barIndex * 4;
		var foundClipIndex = -1;
		for (var clipIndex = 0; clipIndex < numberOfArrangementClipsInTrack; clipIndex++) {
			var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
			var clipStartTime = parseInt(clip.get("start_time"));
			var clipLength = parseInt(clip.get("length"));
			if (clipStartTime <= barStartBeats && clipStartTime + clipLength >= barStartBeats + barLengthBeats) {
				offsetInClipInBeats = barPositionInLoopBeats - clipStartTime;
				foundClipIndex = clipIndex;
				break;
			}
		}
		//log("debug", "Inserting bar into clip: " + clipIndex + " offset: " + offsetInClipInBeats + "\n");
		insertionData.push([foundClipIndex, barData, offsetInClipInBeats, barIndex]);
	}

	// Get the clip indices and make them unique.
	var clipIndices = insertionData.map(function(value, index, arr) {
		return value[0];
	});
	//log("debug", "Clip indices: " + clipIndices + "\n");

	// Clear the clips. Only those that are not -1.
	var nonEmptyClipIndices = clipIndices.filter(function(value, index, arr) {
		return value != -1;
	});
	clearClips(trackIndex, nonEmptyClipIndices);

	// Insert the bars into the clips.
	for (var i = 0; i < insertionData.length; i++) {
		var data = insertionData[i];
		var clipIndex = data[0];
		var barData = data[1];
		var offsetInClipInBeats = data[2];
		var barIndex = data[3];
		if (clipIndex == -1) {
			//log("debug", "No clip found for bar " + barIndex + " in track " + trackIndex + " offset: " + offsetInClipInBeats + "\n");
			clipIndex = createNewClip(trackIndex, offsetInClipInBeats);
			offsetInClipInBeats = 0;
			//continue;
		}
		//log("debug", "Inserting bar into clip " + clipIndex + " in track " + trackIndex + " offset: " + offsetInClipInBeats + "\n");
		insertBarIntoClip(barData, trackIndex, clipIndex, offsetInClipInBeats);
	}
}

function handleFillUpResult(result, startBeat, lengthBeats) {
	//log("debug", "Handling fillup result.\n");
	//log("debug", "Start beat: " + startBeat + " length beats: " + lengthBeats + "\n");

	var results = result["result"]["results"];
	//log("debug", "Results: " + results.length + "\n");

	// Get the AI tracks.
	var aiTracksIndices = getAiTracksIndices();
	//log("debug", "AI tracks: " + aiTracksIndices + "\n");

	// Go through the results.
	var elapsedTimeTotalCreateClip = 0;
	var elapsedTimeTotalInsertBar = 0;
	for (var resulIndex = 0; resulIndex < results.length; resulIndex++) {

		// Unpack the result data.
		var resultData = results[resulIndex];
		var trackIndex = resultData["track_index"];
		var barIndex = resultData["bar_index"];
		var barData = resultData["bar_data"];

		// Get the right track index.
		trackIndex = aiTracksIndices[trackIndex];

		//log("debug", "Track index: " + trackIndex + " bar index: " + barIndex + "\n");

		// Get the track.
		//var track = new LiveAPI("live_set tracks " + trackIndex);

		// Create a clip.
		// We will measure the time to profile the performance.
		var startTime = new Date().getTime();
		var startBeatsClip = startBeat + barIndex * 4;
		var clipIndex = createNewClip(trackIndex, startBeatsClip);
		//log("debug", "Created clip at start beats: " + startBeatsClip + " clip index: " + clipIndex + "\n");
		var elapsedTime = new Date().getTime() - startTime;
		elapsedTime = elapsedTime / 1000;
		elapsedTimeTotalCreateClip += elapsedTime;
		//log("debug", "Creating clip took: " + elapsedTime + " s.\n");


		// Insert the bar into the clip.
		var startTime = new Date().getTime();
		insertBarIntoClip(barData, trackIndex, clipIndex, 0);
		var elapsedTime = new Date().getTime() - startTime;
		elapsedTime = elapsedTime / 1000;
		elapsedTimeTotalInsertBar += elapsedTime;
		//log("debug", "Inserting bar took: " + elapsedTime + " s.\n");
	}
	//log("debug", "Total time creating clips: " + elapsedTimeTotalCreateClip + " s.\n");
	//log("debug", "Total time inserting bars: " + elapsedTimeTotalInsertBar + " s.\n");
}

/*
function handleFillUpResultOptimized(result, startBeat, lengthBeats) {

	post("\n");
	post("\n");

	// Get the AI tracks.
	var aiTracksIndices = getAiTracksIndices();
	log("debug", "AI tracks: " + aiTracksIndices + "\n");
	
	// Go through all the AI tracks and make sure there is only one clip that starts at the start of the loop and is as long as the loop.
	for (var i = 0; i < aiTracksIndices.length; i++) {
		var trackIndex = aiTracksIndices[i];
		ensureOneClipTrack(trackIndex, startBeat, lengthBeats);
	}

	// TODO Fill stuff.
	// Use the original song_data, which should be in result.
}

*/

function ensureOneClipTrack(trackIndex, startBeat, lengthBeats) {

	// Get the track.
	var track = new LiveAPI("live_set tracks " + trackIndex);

	// Get the arrangement clip indices in the loop.
	var clipIndices = getArrangementClipIndicesInLoop(trackIndex, startBeat, lengthBeats);

	// If there is one clip and it starts at the start of the loop and is as long as the loop, do nothing.
	if (clipIndices.length == 1) {
		var clipIndex = clipIndices[0];
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
		var clipStart = parseInt(clip.get("start_time"));
		var clipLength = parseInt(clip.get("length"));
		if (clipStart == startBeat && clipLength == lengthBeats) {
			//post("Clip is already correct.\n");
			return;
		}
	}

	// Delete all clips.
	while (clipIndices.length > 0) {
		var clipIndex = clipIndices.pop();
		//log("debug", "Deleting clip: " + clipIndex + "\n");
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
		//log("debug", "Got clip.\n");
		track.call("delete_clip", "id", clip.id);
		clipsIndices = getArrangementClipIndicesInLoop(trackIndex, startBeat, lengthBeats);
	}

	// Create a new clip.
	var clipIndex = createNewClip(trackIndex, startBeat, lengthBeats);

	// Get the clip indices again. This time we should have only one clip.
	var clipIndices = getArrangementClipIndicesInLoop(trackIndex, startBeat, lengthBeats);
	if (clipIndices.length != 1) {
		log("error", "More than one clip in loop. Got: " + clipIndices.length + "\n");
		return;
	}
}


function getArrangementClipIndicesInLoop(trackIndex, startBeats, lengthBeats) {

	// Get the number of arrangement clips in the track.
	var numberOfArrangementClipsInTrack = new LiveAPI("live_set tracks " + trackIndex).getcount("arrangement_clips");
	//log("debug", "Number of arrangement clips in track: " + numberOfArrangementClipsInTrack + "\n");

	// Get the clip indices that are in the loop.
	var clipIndices = [];
	for (var clipIndex = 0; clipIndex < numberOfArrangementClipsInTrack; clipIndex++) {
		var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
		var clipStart = parseInt(clip.get("start_time"));
		var clipLength = parseInt(clip.get("length"));
		if (clipStart >= startBeats && clipStart + clipLength <= startBeats + lengthBeats) {
			clipIndices.push(clipIndex);
		}
	}
	//log("debug", "Clip indices in loop: " + clipIndices.length + "\n");

	return clipIndices;
}


function createNewClip(trackIndex, startBeats, lengthBeats) {

	// If lentghBeats is not defined, set it to 4.
	if (lengthBeats == null) {
		lengthBeats = 4;
	}

    // Get the track.
    var track = new LiveAPI("live_set tracks " + trackIndex);

    // Get the clip slots.
    var clipSlots = track.get("clip_slots");

    // Find the first empty clip slot.
    //var emptyClipSlotIndex = -1;
    //for (var clipSlotIndex = 0; clipSlotIndex < clipSlots.length; clipSlotIndex++) {
	//	var clipSlot = LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipSlotIndex);
    //    var clipInClipSlot = clipSlot.get("clip");
    //    if (clipInClipSlot[1] == 0) {
    //       emptyClipSlotIndex = clipSlotIndex;
    //        break;
    //    }
    //}

	//if (emptyClipSlotIndex == -1) {
	//	displayMessage("No empty clip slot found.");
	//	return;
	//}

	// Get the first clip slot.
	var emptyClipSlotIndex = 1;

    // Get the clip slot.
    var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + emptyClipSlotIndex);

	// Delete the clip in the clip slot.
	//var clipInClipSlot = clipSlot.get("clip");
	//if (clipInClipSlot[1] != 0) {
	//	clipSlot.call("delete_clip");
	//	log("debug", "Deleted clip in clip slot.\n");
	//}

	// Create a new clip in the clip slot.
	var clipInClipSlot = clipSlot.get("clip");
	if (clipInClipSlot[1] == 0) {
    	clipSlot.call("create_clip", lengthBeats);
	}

    // Duplicate into arrangement view.
    var clipInClipSlot = clipSlot.get("clip");
    track.call("duplicate_clip_to_arrangement", clipInClipSlot, startBeats);

	// Find the clip index.
	var arrangementClipsCount = track.getcount("arrangement_clips");
    var clipIndex = -1;
	for (var i = 0; i < arrangementClipsCount; i++) {
        var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + i);
        var clipStartBeats = clip.get("start_time");
        if (clipStartBeats == startBeats) {
			//log("debug", "Returning clip index: " + i + "\n");
            clipIndex = i;
        }
    }
	if (clipIndex == -1) {
		post("Error: Could not find clip index.\n");
		throw "Could not find clip index.";
	}

	// Delete the clip slot.
	//clipSlot.call("delete_clip");

    return clipIndex;
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


function insertBarIntoClip(barData, trackIndex, clipIndex, offsetInClipInBeats) {
	//log("debug", "Inserting bar into track " + trackIndex + " clip " + clipIndex + " offset: " + offsetInClipInBeats + "\n");

	// Get the clip.
	var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);

	var barIndex = offsetInClipInBeats / 4;
	//log("debug", "Bar index: " + barIndex + "\n");

	// Get the notes from the clip.
	var notes = barDataToNotes(barIndex, barData);
	clip.call("add_new_notes", notes);
}


function barDataToNotes(barIndex, barData) {

	// Create the notes object.
	var notes = {
		"notes": []
	}

	var barOffset = barIndex * 32;
	//log("debug", "Bar offset: " + barOffset + "\n");

	// The track data has a "notes" array. Iterate through the notes and add the notes to the notes object.
	for (var i = 0; i < barData["notes"].length; i++) {
		var noteData = barData["notes"][i];
		var noteStart = noteData["start"] + barOffset;
		var noteEnd = noteData["end"] + barOffset;
		var notePitch = noteData["note"];
		var noteVelocity = 80;

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


function getLoopInfoBeats() {

    // Get the live set object.
    var liveSet = new LiveAPI("live_set");

    // Get the loop property.
    var loopActive = liveSet.get("loop");
    var loopStartBeats = liveSet.get("loop_start");
    var loopLengthBeats = liveSet.get("loop_length");

	// If any of the beats has a fraction, raise an error.
	if (loopStartBeats % 1 != 0 || loopLengthBeats % 1 != 0) {
		displayMessage("Use full bars.");
		throw "Use full bars.";
	}

	// Return the loop info.
    return {
        loopActive: loopActive,
        loopStartBeats: parseInt(loopStartBeats),
        loopLengthBeats: parseInt(loopLengthBeats)
    };
}


function displayMessage(message) {
	log("info", message + "\n");
	var messageField = this.patcher.getnamed("messageField");
	messageField.set("");
	messageField.set(message);
	return;
}


function clearMessage() {
	var messageField = this.patcher.getnamed("messageField");
	messageField.set("");
	return;
}


function assert(condition, message) {
	if (!condition) {
		throw message;
	}
}


function disableUndo() {
	//var app = new LiveAPI("live_app");
    //app.set("undo_step", 0);
    //post("Undo disabled\n");
}


function enableUndo() { 
	//var app = new LiveAPI("live_app");
    //app.set("undo_step", 1);
    //post("Undo enabled\n");
}