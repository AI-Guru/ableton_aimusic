autowatch = 1;

function bang() {
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
        loopStartBeats: loopStartBeats,
        loopLengthBeats: loopLengthBeats
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