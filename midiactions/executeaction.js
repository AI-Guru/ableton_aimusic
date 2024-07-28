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

    // Guitarize.
    else if (command == "guitarize") {
      post("Guitarizing\n");
      notes = getNotesOfClip(selectedTrackIndex, selectedClipIndex, ignoreControlEvents);
      notes = guitarizeNotes(notes);
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
  post("Grooving notes by " + grooveAmount + "\n");

  // Find a good range for grooving.
  var minimumGrooveAmount = -grooveAmount;
  var maximumGrooveAmount = grooveAmount;

  // Groove all the notes.
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var noteStartTime = note["start_time"];
    var randomGrooveAmount = Math.random() * (maximumGrooveAmount - minimumGrooveAmount) + minimumGrooveAmount;
    post("Random groove amount: " + randomGrooveAmount + "\n");
    var newNoteStartTime = Math.max(0, noteStartTime + randomGrooveAmount);
    post("Old note start time: " + noteStartTime + " new note start time: " + newNoteStartTime + "\n");
    note["start_time"] = newNoteStartTime;
  }

  // Remove note overlap.
  removeNoteOverlap(notes);

  // Done.
  return notes;
}

function removeNoteOverlap(notes, epsilon) {

  if (epsilon === undefined) {
    epsilon = 0.0001;
  }

  // Raise an exception if notes is not an array.
  if (!Array.isArray(notes)) {
    throw "Notes is not an array";
  }

  // Raise an exception if epsilon is not a number.
  if (typeof epsilon !== "number") {
    throw "Epsilon is not a number";
  }

  // If two notes are overlapping - both have the same pitch and one note's end time is after another notes start time, shift the end time an epsilon before the star time.
  for (var noteIndex1 = 0; noteIndex1 < notes.length; noteIndex1++) {
    for (var noteIndex2 = noteIndex1 + 1; noteIndex2 < notes.length; noteIndex2++) {
      var note1 = notes[noteIndex1];
      var note2 = notes[noteIndex2];
      if (note1["pitch"] == note2["pitch"] && note1["start_time"] + note1["duration"] > note2["start_time"]) {
        note1["duration"] = note2["start_time"] - note1["start_time"] - epsilon;
      }
    }
  }

  return notes;
}

function guitarizeNotes(notes) {

  // Raise an exception if notes is not an array.
  if (!Array.isArray(notes)) {
    throw "Notes is not an array";
  }

  // Print the first note.
  post("First note: " + JSON.stringify(notes[0]) + "\n");

  // Get the value of the umenu "menuResolution".
  var resolution = getValueFromObject("menuResolution");
  var resolutionValues = ["8th", "16th"];
  if (resolutionValues.indexOf(resolution) == -1) {
    throw "Invalid resolution: " + resolution;
  }

  // Get the time offset mean and variance. This is in percentage of the resolution.
  var timeOffsetMean = getValueFromObject("dialTimeOffsetMean");
  var timeOffsetVariance = getValueFromObject("dialTimeOffsetVariance");

  // Get the velocity offset mean and variance for down strums. This is velocity.
  var downOffsetMean = getValueFromObject("dialDownOffsetMean");
  var downOffsetVariance = getValueFromObject("dialDownOffsetVariance");

  // Get the velocity offset mean and variance for up strums. This is velocity.
  var upOffsetMean = getValueFromObject("dialUpOffsetMean");
  var upOffsetVariance = getValueFromObject("dialUpOffsetVariance");

  // Print the values.
  post("Resolution: " + resolution + "\n");
  post("Time offset mean: " + timeOffsetMean + "\n");
  post("Time offset variance: " + timeOffsetVariance + "\n");
  post("Down offset mean: " + downOffsetMean + "\n");
  post("Down offset variance: " + downOffsetVariance + "\n");
  post("Up offset mean: " + upOffsetMean + "\n");
  post("Up offset variance: " + upOffsetVariance + "\n");

  // Compute the step size in beats.
  var stepSize = 0.0;
  if (resolution == "16th") {
    stepSize = 0.25;
  }
  else if (resolution == "8th") {
    stepSize = 0.5;
  }

  // Do the loop.
  var currentStep = 0.0;
  var nextStep = stepSize;
  var newNotes = [];
  var maxIterations = 100;
  var currentIteration = 0;
  while (newNotes.length < notes.length && maxIterations > 0) {

    // Print the current step.
    post("Current step: " + currentStep + " next step: " + nextStep + "\n");
    post("New notes: " + newNotes.length + "/" + notes.length + "\n");

    // Find all the notes where the start time is between the current step and the next step.
    // Also make sure that the notes star times are closer to the current step than the next step.
    var notesInRange = [];
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      if (note["start_time"] >= currentStep && note["start_time"] < nextStep) {
        var distanceToCurrentStep = Math.abs(note["start_time"] - currentStep);
        var distanceToNextStep = Math.abs(note["start_time"] - nextStep);
        if (distanceToCurrentStep < distanceToNextStep) {
          notesInRange.push(note);
        }
      }
    }
    post("Notes in range: " + notesInRange.length + "\n");

    // Determine if this is a down or up strum.
    var downStrum = currentIteration % 2 == 0;

    // Strum down. Sort the notes by pitch ascending.
    var velocityMean = 0;
    var velocityVariance = 0;
    if (downStrum) {
      post("Down strum\n");
      notesInRange.sort(function(a, b) {
        return a["pitch"] - b["pitch"];
      });
      velocityMean = downOffsetMean;
      velocityVariance = downOffsetVariance;
    }

    // Strum up. Sort the notes by pitch descending.
    else {
      post("Up strum\n");
      notesInRange.sort(function(a, b) {
        return b["pitch"] - a["pitch"];
      });
      velocityMean = upOffsetMean;
      velocityVariance = upOffsetVariance;
    }

    // Add the time offset and velocity offset.
    var timeOffset = currentStep;
    for (var i = 0; i < notesInRange.length; i++) {
     
      // Add the time offset. Sample from a normal distribution.
      var sampledTimeOffset = sampleFromNormalDistribution(timeOffsetMean, timeOffsetVariance) * stepSize / 100.0;
      post("Sampled time offset: " + sampledTimeOffset + "\n");
      timeOffset += sampledTimeOffset;

      // Add the velocity offset. Sample from a normal distribution.
      var sampledVelocity = sampleFromNormalDistribution(velocityMean, velocityVariance);

      post("Time offset: " + timeOffset + " velocity: " + sampledVelocity + "\n");

      // Raise an exception if the time offset is nan.  
      if (isNaN(timeOffset)) {
        throw "Time offset is nan";
      }

      // Raise an exception if the velocity is nan.
      if (isNaN(sampledVelocity)) {
        throw "Velocity is nan";
      }

      // Update the note.
      var note = notesInRange[i];
      note["start_time"] = timeOffset;
      note["velocity"] = sampledVelocity
    }

    // Add the notes to the new notes.
    newNotes = newNotes.concat(notesInRange);

    // Next round.
    currentIteration++;
    maxIterations--;
    currentStep = nextStep;
    nextStep = currentStep + stepSize;
  }
  if (maxIterations == 0) {
    throw "Max iterations reached";
  }

  // Remove note overlap.
  removeNoteOverlap(newNotes);

  // Done.
  return newNotes;
}

function getValueFromObject(objectName) {
  var object = this.patcher.getnamed(objectName);
  if (object == null) {
    throw "Object not found: " + objectName;
  }

  // Check if it is a umenu.
  if (object.maxclass == "umenu") {
    var items = object.getattr("items");
    var selectedIndex = object.getvalueof();
    var selected = items[selectedIndex * 2];
    return selected;
  }

  // Check if it is a live.dial.
  else if (object.maxclass == "live.dial") {
    var value = object.getvalueof();
    value = parseFloat(value);
    return value;
  }

  else {
    throw "Object has unknown class: " + object.maxclass;
  }

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

function sampleFromNormalDistribution(mean, variance) {
  var u = 1 - Math.random();
  var v = 1 - Math.random();
  var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  var sample = mean + Math.sqrt(variance) * z;
  if (isNaN(sample)) {
    post("Mean: " + mean + " variance: " + variance + "\n");
    post ("U: " + u + " V: " + v + " Z: " + z + "\n");
    throw "Sample is nan";
  }
  return sample;
}

