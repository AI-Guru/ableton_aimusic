autowatch = 1;

function bang() {
    //setUp();
}

function setUp() {

    var requiredTrackNames = [
        "AI Drums",
        "AI Bass",
        "AI Guitar"
    ];

    // Get all the tracks.
    var trackNames = [];
    var liveSet = new LiveAPI("live_set");
    var numTracks = liveSet.getcount("tracks");
    for (var i = 0; i < numTracks; i++) {
        var track = new LiveAPI("live_set tracks " + i);
        var trackName = track.get("name")[0];
		//postObject(trackName);
        trackNames.push(trackName);
		//post(typeof trackName + "\n")
    }
    post("Track names: " + trackNames + "\n");

	// Find the missing tracks.
	var missingTracks = [];
	for (var i = 0; i < requiredTrackNames.length; i++) {
		if (trackNames.indexOf(requiredTrackNames[i]) == -1) {
			missingTracks.push(requiredTrackNames[i]);
		}
	}
	if (missingTracks.length > 0) {
		post("Missing tracks: " + missingTracks + "\n");
	}

	// Create the missing tracks.
	for (var i = 0; i < missingTracks.length; i++) {
		var track = createTrack(missingTracks[i]);
		var clips = createArrangementClips(track, 4);
	}


}

function createTrack(name) {

	// Create a track.
	var liveSet = new LiveAPI("live_set");
	var result = liveSet.call("create_midi_track");
	var id = result[1];

	// Get the track and set its name.
	//var track = getTrackWithId(id);
	var trackIndex = getTrackIndexWithId(id);
	var track = new LiveAPI("live_set tracks " + trackIndex);
	track.set("name", name);

	return track;
}

function createArrangementClips(trackIndex, numClips) {
	var clips = [];

	// Create clips.
	for (var i = 0; i < numClips; i++) {
		var clip = createArrangementClip(trackIndex, i);
		clips.push(clip);
		break
	}

	return clips;
}

function createArrangementClip(trackIndex) {

	// Create a clip.
	var arrangementClips = new LiveAPI("live_set tracks " + trackIndex + " arrangement_clips");
	var result = arrangementClips.call("create_clip", 0);
	postObject(result);	

}

function postObject(obj) {
	post("Object: " + obj + "\n");
	post(typeof obj + "\n");
	for (var key in obj) {
		post(key + ": " + obj[key] + "\n");
	}
}

function getTrackWithId(id) {
	var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");
	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		if (track.id == id) {
			return track;
		}
	}
	return null;
}

function getTrackIndexWithId(id) {
	var liveSet = new LiveAPI("live_set");
	var numTracks = liveSet.getcount("tracks");
	for (var i = 0; i < numTracks; i++) {
		var track = new LiveAPI("live_set tracks " + i);
		if (track.id == id) {
			return i;
		}
	}
	return -1;
}