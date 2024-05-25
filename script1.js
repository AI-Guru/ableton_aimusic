autowatch = 1;


function bang() {

    composeTrack(callback=function(response) {
        post("Response: ", response, "\n");
        var trackData = response["song_data"]["tracks"][0];
        setTrackNotes(0, 0, trackData);
    });

}

function setTrackNotes(trackIndex, clipIndex, trackData) {

    // Get the clip.
    var apiPath = "live_set tracks " + trackIndex + " arrangement_clips " + clipIndex;
    var clip = new LiveAPI(apiPath);

    // Convert the track data to notes.
    var notes = trackDataToNotes(trackData);
    post("Notes: ", notes, "\n");
    
    // Delete all notes and add the new notes.
    clip.call("remove_notes_extended", 0, 128, 0, 128);
    clip.call("add_new_notes", notes);


}

function trackDataToNotes(trackData) {


    // Get the beats per minute. From the LiveAPI.
    var api = new LiveAPI("live_set");
    var bpm = api.get("tempo");
    post("BPM: ", bpm, "\n");

    // Create the notes object.
    var notes = {
        "notes": []
    }

    // The track data has a "bars" array. Iterate through the bars and add the notes to the notes object.
    for (var i = 0; i < trackData["bars"].length; i++) {
        var barData = trackData["bars"][i];
        for (var j = 0; j < barData["notes"].length; j++) {
            var noteData = barData["notes"][j];
            var noteStart = noteData["start"];
            var noteEnd = noteData["end"];
            var notePitch = noteData["note"];
            var noteVelocity = 80;

            // Convert the note start and end times to seconds.
            noteStart += i * 32;
            noteEnd += i * 32;
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
    }

    return notes;
}

function convertTimeToSeconds(timeInBeats, bpm) {
    // Time in beats is in 32nd notes resolution.
    return timeInBeats * (60 / bpm) / 4;

}


function adding_notes() {

    // Get a track.
    var instrumentsIndices = getIndicesOfInstrumentTracks();
    var instrumentIndex = instrumentsIndices[0];
    
    // Get the clip.
    var apiPath = "live_set tracks " + instrumentIndex + " arrangement_clips 0";
    var clip = new LiveAPI(apiPath);

    // Delete all notes.
    clip.call("remove_notes_extended", 0, 128, 0, 128);
    
    // Add a note.
    var notes = {
        "notes": [
            {
                "pitch": 60,
                "start_time": 0,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 62,
                "start_time": 1,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 64,
                "start_time": 2,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 65,
                "start_time": 3,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 67,
                "start_time": 4,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 69,
                "start_time": 5,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 71,
                "start_time": 6,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            },
            {
                "pitch": 72,
                "start_time": 7,
                "duration": 0.5,
                "velocity": 100,
                "mute": 0
            }
        ]
    }
    clip.call("add_new_notes", notes);

    return;

    // Get the selected track.
    var apiPath = "live_set tracks 0";
    var api = new LiveAPI(apiPath);
    var name = api.get("name");
    post("Name: ", name, "\n");

    // Get the selected clip.
    var apiPath = "live_set tracks 0 arrangement_clips 0";
    var api = new LiveAPI(apiPath);
    var name = api.get("name");
    post("Name: ", name, "\n");

    // Get the notes.
    var apiPath = "live_set tracks 0 arrangement_clips 0";
    var clip = new LiveAPI(apiPath);
    var notes = clip.call("get_notes_extended", 0, 128, 0, 128);
    post("Notes: ", notes, "\n");

    // Transpose the last note one semitone up.
    var lastNote = notes[notes.length - 6];
    var newPitch = lastNote + 1;
    notes[notes.length - 6] = newPitch;
    post("New Notes: ", notes, "\n");

}


// Function to get the indices of all instrument tracks in the live set.
function getIndicesOfInstrumentTracks() {

    // Create a new LiveAPI object pointing to the live set's tracks
    var api = new LiveAPI("live_set");
    var trackCount = api.getcount("tracks");

    // Iterate through all tracks.
    var instrumentTrackIndices = [];
    var startString = "Inst:";
    for (var i = 0; i < trackCount; i++) {
        var trackApi = new LiveAPI("live_set tracks " + i);
        var trackName = trackApi.get("name").toString();
        if (startsWith(trackName, startString)) {
            post("Instrument Track: ", trackName, "\n");
            instrumentTrackIndices.push(i);
        }
    }

    // Done.
    return instrumentTrackIndices;
}


// Function to determine if a string starts with another string
function startsWith(str, search, pos) {
    pos = pos || 0; // Default the position to 0 if not specified
    return str.indexOf(search, pos) === pos;
}

function getArrangementClipsAndNotes() {
    var pathToTrack = "live_set tracks";
    var api = new LiveAPI();
    
    // Iterate through all tracks to find the one named "Script"
    for (var i = 0; api.path = pathToTrack + ' ' + i, api.id !== 0; i++) {
        if (api.get("name") === "Script") {
            // Track found, now get all clips in the arrangement
            var clipSlots = api.get("clip_slots");
            if (clipSlots.length > 0) {
                api.path = pathToTrack + ' ' + i + " clip_slots";
                for (var j = 0; api.path = pathToTrack + ' ' + i + " clip_slots " + j, api.id !== 0; j++) {
                    // Check if the clip slot contains a clip
                    var hasClip = api.get("has_clip");
                    if (hasClip[0] === 1) {
                        // There's a clip in this slot, get details
                        var clip = new LiveAPI(api.path + " clip");
                        if (clip.get("is_arrangement_clip")[0] === 1) {
                            // It's an arrangement clip, log the clip name
                            post("Arrangement Clip: " + clip.get("name") + "\n");

                            // Fetch and log the notes
                            var notes = clip.call("get_notes", 0, 0, clip.get("length"), 128);
                            for (var k = 0; k < notes.length; k += 6) {
                                post("Note: Pitch=" + notes[k] + ", Start Time=" + notes[k + 1] +
                                     ", Duration=" + notes[k + 2] + ", Velocity=" + notes[k + 3] +
                                     ", Mute=" + notes[k + 4] + "\n");
                            }
                        }
                    }
                }
            }
            break;
        }
    }
}

function getTrackByName(targetTrackName) {
    // Get all the tracks.
    var tracks = new LiveAPI("live_set tracks");
    for (var i = 0; i < tracks.children.length; i++) {
        var candidateTrack = new LiveAPI("live_set tracks " + i);
        var candidateTrackName = candidateTrack.get("name");
        //post("Track: ", candidateTrackName, "\n");
        //post(targetTrackName);

        // If the name matches.
        if (candidateTrackName == targetTrackName) {
            return candidateTrack;
        }
    }
}

// This function retrieves and logs all notes from the currently selected MIDI clip
function getNotesFromSelectedClip(clipApi) {

    // Check if a clip is actually selected and ensure it's a MIDI clip
    if (clipApi.id === 0) {
        post("No MIDI clip is selected or focused.\n");
        return;
    }

    // Define the note range you want to access (usually the whole clip)
    var startTime = 0; // Start at the beginning of the clip
    var endTime = clipApi.get("length"); // Till the end of the clip
    var startPitch = 0; // Lowest MIDI note
    var endPitch = 127; // Highest MIDI note
    var type = clipApi.get("type");

    // Print the above details.
    post("Clip Name: " + clipApi.get("name") + "\n");
    post("Clip Length: " + clipApi.get("length") + "\n");
    post("Start Marker: " + clipApi.get("start_marker") + "\n");
    post("End Marker: " + clipApi.get("end_marker") + "\n");
    post("Type: " + type + "\n");

    // Retrieve the notes: get_notes(startTime, timeSpan, startPitch, pitchSpan)
    var notes = clipApi.call("get_notes", startTime, endTime, startPitch, endPitch);

    // Print each note's details
    for (var i = 0; i < notes.length; i += 6) {
        post("Note: Pitch=" + notes[i] + ", Start Time=" + notes[i + 1] +
             ", Duration=" + notes[i + 2] + ", Velocity=" + notes[i + 3] +
             ", Mute=" + notes[i + 4] + ", Probability=" + notes[i + 5] + "\n");
    }
}

function getSelectedTrack() {
    var liveApiPath = "live_set view detail_clip";
    var clipApi = new LiveAPI(liveApiPath);

    if (clipApi.id !== 0) {
        post("Clip Name: " + clipApi.get("name"));
        post("Clip Length: " + clipApi.get("length"));
        post("Start Marker: " + clipApi.get("start_marker"));
        post("End Marker: " + clipApi.get("end_marker"));
        post("\n");

        printNotes(clipApi);

    } else {
        post("No clip selected.\n");
    }

}

// This function retrieves and logs all notes from the currently selected MIDI clip
function getNotesFromSelectedClip() {
    // Create a LiveAPI object pointing to the currently selected clip
    var clipApi = new LiveAPI("live_set view detail_clip");

    // Check if a clip is actually selected and ensure it's a MIDI clip
    if (clipApi.id === 0 || clipApi.get("type") !== "MidiClip") {
        post("No MIDI clip is selected or focused.\n");
        return;
    }

    // Define the note range you want to access (usually the whole clip)
    var startTime = 0; // Start at the beginning of the clip
    var endTime = clipApi.get("length"); // Till the end of the clip
    var startPitch = 0; // Lowest MIDI note
    var endPitch = 127; // Highest MIDI note

    // Retrieve the notes: get_notes(startTime, timeSpan, startPitch, pitchSpan)
    var notes = clipApi.call("get_notes", startTime, endTime, startPitch, endPitch);

    // Print each note's details
    for (var i = 0; i < notes.length; i += 6) {
        post("Note: Pitch=" + notes[i] + ", Start Time=" + notes[i + 1] +
             ", Duration=" + notes[i + 2] + ", Velocity=" + notes[i + 3] +
             ", Mute=" + notes[i + 4] + ", Probability=" + notes[i + 5] + "\n");
    }
}

function printNotes(clipApi) {
    // Use the get_notes_extended method to get the notes.
    var notes = clipApi.call("get_notes_extended");
    post("Notes: ", notes, "\n");

}

function getNotes() {

    // Get the selected clip.
    var clip = new LiveAPI("live_set view detail_clip");

    // Get the notes.
    var notes = clip.call("get_notes_extended");
    post("Notes: ", notes, "\n");






    // Get the notes.
    var notes = clip.get("notes");

    // Print the notes to the Max console.
    post("Notes: ", notes, "\n");
}


function composeTrack(callback) {

    var songData = {
        "tracks": [],
    }

    var parameters = {
        "instrument": "29",
        "genre": "BLACKMETAL",
        "density": 4,
        "temperature": 0.8,
        "harmonymode": "polyphone",
        "instrumentmode": "full",
        "selectednotes": ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]
    }

    var command = {
        "command": "addinstrument",
        "data": songData,
        "parameters": parameters
    };

    postCommand(command, function(response) {
        callback(response);
        // Print the response to the Max console.
        //for (var key in response) {
        //    post(key, ": ", response[key], "\n");
        //}
    });
}


function postCommand(command, callback) {

    var url = "http://127.0.0.1:5885/api/command";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    //Send the proper header information along with the request and add the command as a JSON string payload.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            //Print the response to the Max console
            post("Response: ", xhr.responseText, "\n");
            var responseJSON = JSON.parse(xhr.responseText);
            callback(responseJSON);
        }
    }
    xhr.send(JSON.stringify(command));

}
