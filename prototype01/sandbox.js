autowatch = 1;

function bang() {

    // Get all tracks.
    var liveSet = LiveAPI("live_set");
    var numberOfTracks = liveSet.getcount("tracks");
    post(numberOfTracks + "\n");

    // Post the name for each track.
    for (var trackIndex=0; trackIndex < numberOfTracks; trackIndex++) {
        var track = LiveAPI("live_set tracks " + trackIndex);
        var trackName = track.get("name");
        post(trackName + "\n");
    }

    // Get the number of clip slots.
    var trackIndex = 1;
    var track = LiveAPI("live_set tracks " + trackIndex);
    var numberOfClipSlots = track.getcount("clip_slots");
    post("Track " + trackIndex + " has " + numberOfClipSlots + " clip slots." + "\n");

    // See if any clip slot has clips.
    for (var clipSlotIndex=0; clipSlotIndex < numberOfClipSlots; clipSlotIndex++) {
        var clipSlot = LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipSlotIndex);
        var clipInClipSlot = clipSlot.get("clip");
        if (clipInClipSlot[1] == 0) {
            post("No clip in clip slot " + clipSlotIndex + "\n")
        }
    }

    // Get the first empty clip slot.
    var emptyClipSlotIndex = -1;
    for (var clipSlotIndex=0; clipSlotIndex < numberOfClipSlots; clipSlotIndex++) {
        var clipSlot = LiveAPI("live_set tracks " + trackIndex + " clip_slots " + clipSlotIndex);
        var clipInClipSlot = clipSlot.get("clip");
        if (clipInClipSlot[1] == 0) {
            emptyClipSlotIndex = clipSlotIndex;
            break
        }
    }
    if (emptyClipSlotIndex != -1) {
        post("Found empty clip slot at index " + emptyClipSlotIndex);
    }

    // Create a clip.
    var clipSlot = LiveAPI("live_set tracks " + trackIndex + " clip_slots " + emptyClipSlotIndex);
    clipSlot.call("create_clip", 4);

    // Get the clip.
    var clipInClipSlot = clipSlot.get("clip");
    //clipInClipSlot.name.set("666");

    // Get the track.
    var track = LiveAPI("live_set tracks " + trackIndex);
    track.call("duplicate_clip_to_arrangement", clipInClipSlot, 24);
    clipSlot.call("delete_clip");

}

function oldStuff() {

    post("[sandbox.js] bang\n");

    // Get the loop status in beats.
    var loopStatusBeats = getLoopInfoBeats();
    post("loopActive: ", loopStatusBeats.loopActive, "\n");
    post("loopStartBeats: ", loopStatusBeats.loopStartBeats, "\n");
    post("loopLengthBeats: ", loopStatusBeats.loopLengthBeats, "\n");

    // Get the loop status in bars.
    var loopStatusBars = getLoopInfoBars();
    post("loopActive: ", loopStatusBars.loopActive, "\n");
    post("loopStartBars: ", loopStatusBars.loopStartBars, "\n");
    post("loopLengthBars: ", loopStatusBars.loopLengthBars, "\n");

    // Get the selected track.
    var selectedTrack = new LiveAPI("live_set view selected_track");
    var selectedTrackId = selectedTrack.id;
    var selectedTrackIndex = -1;
    var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");
	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		if (track.id == selectedTrackId) {
			selectedTrackIndex = i;
            break;
		}
	}
    if (selectedTrackIndex == -1) {
        throw "Selected track not found in tracks.";
    }
    post("selectedTrackId: ", selectedTrackId, "\n");
    post("selectedTrackIndex: ", selectedTrackIndex, "\n");


    // Get the arrangement clips of that track.
    var arrangementClips = new LiveAPI("live_set tracks " + selectedTrackIndex);
    var numArrangementClips = arrangementClips.getcount("arrangement_clips");
    post("numArrangementClips: ", numArrangementClips, "\n");

    // Get the individual bar notes.
    notes = [];
    var startBeats = loopStatusBeats.loopStartBeats
    var endBeats = loopStatusBeats.loopStartBeats + loopStatusBeats.loopLengthBeats;
    post("startBeats: ", startBeats, " endBeats: ", endBeats, "\n");
    for (var startIndex = startBeats; startIndex < endBeats; startIndex+=4) {
        post("startIndex: ", startIndex, " endIndex: ", startIndex + 4, "\n");
        for (var i = 0; i < numArrangementClips; i++) {
            var clip = new LiveAPI("live_set tracks " + selectedTrackIndex + " arrangement_clips " + i);
            var notes = clip.call("get_notes_extended", 0, 128, startIndex, 4);
            notes = JSON.parse(notes)["notes"];
            post("notes: ", notes, " ", typeof notes, "\n");
        }
    }



    return;

    



    // Get all the arrangement tracks that are in the loop.
    var clipsInLoop = getClipsInRange(loopStatusBars.loopStartBars, loopStatusBars.loopStartBars + loopStatusBars.loopLengthBars);

}

function getLoopInfoBars() {
    var loopStatusBeats = getLoopInfoBeats();

    // Get the beats per bar.
    var liveSet = new LiveAPI("live_set");

    // Get the meter.
    var timeSignatureNumerator = liveSet.get("signature_numerator");
    var timeSignatureDenominator = liveSet.get("signature_denominator");

    // If not 4/4, do an alert.
    if (timeSignatureNumerator != 4 || timeSignatureDenominator != 4) {
        throw "Time signature is not 4/4. This is not supported.";
    }

    // Calculate the loop status in bars.
    var loopStartBars = loopStatusBeats.loopStartBeats / 4;
    var loopLengthBars = loopStatusBeats.loopLengthBeats / 4;
    return {
        loopActive: loopStatusBeats.loopActive,
        loopStartBars: loopStartBars,
        loopLengthBars: loopLengthBars
    };
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

// Gets all the arrangement clips between the startBar and endBar (not inclusive).
function getClipsInRange(startBar, endBar) {
    
    // Get the live set object.
    var liveSet = new LiveAPI("live_set");

    // Get the tracks.
    var tracks = liveSet.get("tracks");

    // Get the arrangement tracks.
    var clips = [];
    for (var i = 0; i < tracks.length; i++) {
        var track = new LiveAPI(tracks[i]);
        var clipSlots = track.get("clip_slots");
        for (var j = 0; j < clipSlots.length; j++) {
            var clipSlot = new LiveAPI(clipSlots[j]);
            var clip = clipSlot.get("clip");
            if (clip) {
                var clipStartBar = clip.get("start_marker");
                var clipEndBar = clip.get("end_marker");
                if (clipStartBar >= startBar && clipEndBar <= endBar) {
                    clips.push(clip);
                }
            }
        }
    }

    return clips;

}