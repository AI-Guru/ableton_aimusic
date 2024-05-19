autowatch = 1;
inlets = 1;
outlets = 1;

function postCommand(command) {

    var url = "http://127.0.0.1:5885/api/command";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    //Send the proper header information along with the request and add the command as a JSON string payload.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            //Print the response to the Max console
            //post("Response: ", xhr.responseText, "\n");
            try {
                var responseJSON = JSON.parse(xhr.responseText);
                propagateResults(command, responseJSON);
            }
            catch (e) {
                post("Error parsing JSON response: ", e, "\n Response text:" + xhr.responseText + "\n");
            }
        }
    }
    xhr.send(JSON.stringify(command));

}

function propagateResults(command, commandResult) {
    var dictionary = {
        "command": command,
        "result": commandResult
    };
    outlet(0, "postCommandResponse", dictionary);
}