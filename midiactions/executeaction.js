autowatch = 1;

//const int midiNoteNumberShift = -3 * 12; 
controlNoteStart = 29;
controlNoteEnd = 36;


function execute(command, commandParameter) {
  post("Command: " + command + " " + commandParameter + "\n");

  // There is a checkbox in the UI that can be used to disable the script.
  // It has the name ignoreControlEventsCheckbox.
  // Get its value.
  var object = this.patcher.getnamed("ignoreControlEventsCheckbox");
  var ignoreControlEvents = parseInt(object.getvalueof()) == 1;

  // Get the selected clips.
  var selectedClips = getSelectedClips();
  post("Selected clips: " + selectedClips + "\n");

  // Find all the notes of all the selected clips that are in the loop region and transpose them up by 3 octaves.
  var liveSet = new LiveAPI("live_set");
  var loopStart = parseInt(liveSet.get("loop_start"));
  var loopLength = parseInt(liveSet.get("loop_length"));
  post("Loop start: " + loopStart + "\n");
  post("Loop length: " + loopLength + "\n");
  for (var i = 0; i < selectedClips.length; i++) {
    var selectedTrackIndex = selectedClips[i][0];
    var selectedClipIndex = selectedClips[i][1];
    post("Selected track index: " + selectedTrackIndex + " selected clip index: " + selectedClipIndex + "\n");

    // Get the clip start time and length.
    var clip = new LiveAPI("live_set tracks " + selectedTrackIndex + " arrangement_clips " + selectedClipIndex);
    var clipStartTime = parseInt(clip.get("start_time"));
    var clipLength = parseInt(clip.get("length"));

    // TODO Is this correct?
    //var localStartTime = Math.max(clipStartTime, loopStart);
    //var localLength = Math.min(clipStartTime + clipLength, loopStart + loopLength) - localStartTime;

    // Use get_notes_extended to get all the notes of the clip.
    // This will return a list of notes, where each note is a dictionary.
    //var notes = clip.call("get_notes_extended", controlNoteEnd + 12, 128 - (controlNoteEnd + 12), localStartTime, localLength);
    //var notes = clip.call("get_notes_extended", controlNoteEnd + 12, 128 - (controlNoteEnd + 12), 0, 1024);
    //notes = JSON.parse(notes);
    //notes = notes["notes"];
    //post("Notes: " + notes + "\n");
    //post("Notes: " + notes.length + "\n");

    var notes = null;

    // Transpose.
    if (command == "transpose") {
      notes = getNotesOfClip(selectedTrackIndex, selectedClipIndex, false);
      notes = transposeNotes(notes, commandParameter);
      clip.call("apply_note_modifications", {"notes": notes});
    }

    // Apply controls.
    else if (command == "controls") {

      // Delete all the notes that are in the control range.
      clip.call("remove_notes_extended", controlNoteStart, controlNoteEnd - controlNoteStart, 0, 128);

      // Find the notes that should be added.
      notes = getNotesOfClip(selectedTrackIndex, selectedClipIndex, false);
      var newNotes = applyControls(notes, commandParameter);
      post("New notes: " + newNotes.length + "\n");
      clip.call("add_new_notes", {"notes": newNotes});
    }

    // Randomize velocity.
    else if (command == "randomize") {
      notes = getNotesOfClip(selectedTrackIndex, selectedClipIndex, ignoreControlEvents);
      notes = randomizeVelocity(notes, commandParameter);
      clip.call("apply_note_modifications", {"notes": notes});
    }

    // Groove.
    else if (command == "groove") {
      notes = getNotesOfClip(selectedTrackIndex, selectedClipIndex, ignoreControlEvents);
      notes = grooveNotes(notes, commandParameter);
      clip.call("apply_note_modifications", {"notes": notes});
    }

    // Unknown command.
    else {
      post("Unknown command: " + command + "\n");
    }

  }
}


function getNotesOfClip(trackIndex, clipIndex, ignoreControlEvents) {

  // Get the clip start time and length.
  var clip = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips " + clipIndex);
  //var clipStartTime = parseInt(clip.get("start_time"));
  //var clipLength = parseInt(clip.get("length"));

  // Use get_notes_extended to get all the notes of the clip.
  // This will return a list of notes, where each note is a dictionary.
  var midiStart = 0;
  var midiRange = 128;
  if (ignoreControlEvents) {
    midiStart = controlNoteEnd;
    midiRange = 128 - controlNoteEnd;
  }

  var notes = clip.call("get_notes_extended", midiStart, midiRange, 0, 128);
  notes = JSON.parse(notes);
  notes = notes["notes"];
  return notes;
}


function transposeNotes(notes, transposeAmount) {
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    note["pitch"] += transposeAmount;
  }
  return notes;
}

function applyControls(notes, pitch) {
  post("Applying controls\n");

  // Find all the note start times and put them into a list.
  // Quantise the note start times to the nearest 32nd note. Round down.
  var noteStartTimes = [];
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var noteStartTime = parseFloat(note["start_time"]);
    noteStartTime = Math.floor(noteStartTime / 0.125) * 0.125;
    noteStartTimes.push(noteStartTime);
  }

  // Remove duplicates.
  var uniqueNoteStartTimes = [];
  for (var i = 0; i < noteStartTimes.length; i++) {
      if (uniqueNoteStartTimes.indexOf(noteStartTimes[i]) === -1) {
          uniqueNoteStartTimes.push(noteStartTimes[i]);
      }
  }
  noteStartTimes = uniqueNoteStartTimes;

  // Sort them.
  noteStartTimes.sort();
  post("Note start times: " + noteStartTimes + "\n");

  // Add the new notes.
  var newNotes = [];
  for (var i = 0; i < noteStartTimes.length; i++) {
    var noteStartTime = noteStartTimes[i];
    var newNote = {
      "start_time": noteStartTime,
      "duration": 0.125,
      "pitch": pitch,
      "velocity": 100,
      "mute": 0
    };
    newNotes.push(newNote);
  }

  return newNotes;
}


function randomizeVelocity(notes, velocityRange) {
  var velocityDefault = 80;
  var velocityMin = velocityDefault - velocityRange;
  var velocityMax = velocityDefault + velocityRange;
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    note["velocity"] = Math.floor(Math.random() * (velocityMax - velocityMin + 1)) + velocityMin;
  }
  return notes;
}


function grooveNotes(notes, grooveAmount) {
  post("Grooving notes\n");

  var minimumGrooveAmount = -grooveAmount;
  var maximumGrooveAmount = grooveAmount;

  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var noteStartTime = note["start_time"];
    var randomGrooveAmount = Math.random() * (maximumGrooveAmount - minimumGrooveAmount) + minimumGrooveAmount;
    post("Random groove amount: " + randomGrooveAmount + "\n");
    var newNoteStartTime = Math.max(0, noteStartTime + randomGrooveAmount);
    post("Old note start time: " + noteStartTime + " new note start time: " + newNoteStartTime + "\n");
    note["start_time"] = newNoteStartTime;
  }

  return notes;
}


// First finds the selected track and its index.
// Then it finds all the clips in arrangement view that intersect with the loop region.
function getSelectedClips() {

  // Find the selected track.
  var selectedTrack = new LiveAPI("live_set view selected_track");
  var selectedTrackId = selectedTrack.id;
  var selectedTrackName = selectedTrack.get("name");
  var selectedTrackIndex = getTrackIndexFromId(selectedTrackId);
  post("Selected track: " + selectedTrackName + " (index: " + selectedTrackIndex + ")\n");

  // Find the loop region.
  var liveSet = new LiveAPI("live_set");
  var loopStart = parseInt(liveSet.get("loop_start"));
  var loopLength = parseInt(liveSet.get("loop_length"));
  post("Loop start: " + loopStart + "\n");
  post("Loop length: " + loopLength + "\n");

  // Find all clips in arrangement view that intersect with the loop region.
  var clipsNumber = new LiveAPI("live_set tracks " + selectedTrackIndex).getcount("arrangement_clips");
  var selectedClips = [];
  for (var clipIndex = 0; clipIndex < clipsNumber; clipIndex++) {
    var clip = new LiveAPI("live_set tracks " + selectedTrackIndex + " arrangement_clips " + clipIndex);
    var clipStart = parseInt(clip.get("start_time"));
    var clipLength = parseInt(clip.get("length"));
    post("Clip start: " + clipStart + "\n");
    post("Clip length: " + clipLength + "\n");
    if (clipStart >= loopStart && clipStart <= loopStart + loopLength) {
      post("Selected clip: " + clip.get("name") + " (index: " + clipIndex + ")\n");
      selectedClips.push([selectedTrackIndex, clipIndex]);
    }
    post("\n");
  }
  return selectedClips;
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