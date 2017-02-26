
function createButton(buttonText, actionMessage)
{
    var btn = document.createElement("BUTTON")
    var textElement = document.createTextNode(buttonText);
    btn.appendChild(textElement);
    btn.onclick = function () {
        //console.log("CLICK!");
        //console.log(actionMessage);
        chrome.runtime.sendMessage(actionMessage, function(response) {
            if (response.result === "success")
            {
                //console.log("success");
                //console.log(textElement);
                textElement.textContent = "copied";
            }
        });
    };
    return btn;
}
function addButtonBefore(beforeElement, buttonText, actionMessage)
{
    //console.log(index + ": " + mediaID);
    //Creating Elements
    //Appending to DOM 
    var btn = createButton(buttonText, actionMessage);
    beforeElement.prepend(btn);
}


function addButtonAfter (afterElement, buttonText, actionMessage)
{
    var btn = createButton(buttonText, actionMessage);
    afterElement.append(btn);

}
//emissions jeunesse suivent généralement le pattern suivant:
//<div class="item" data-mediaid="31640">...</div>
//exemple: http://zonevideo.telequebec.tv/a-z/299/la-pat-patrouille
$(".item").each(function(index){
	var mediaID = $(this).attr("data-mediaid");
    if (mediaID)
    {
        var episodeName = $(this).find("a").text();
        //console.log(episodeName);

        chrome.runtime.sendMessage({action:"add", mediaId:mediaID, episodeName:episodeName});

        addButtonBefore($(this), "- "+ mediaID + " -", {action:"download", mediaID: mediaID});

    }
})

//les séries "adultes" suivent plutôt le pattern suivant:
//<div class="item Integral">...</div>
//et le mediaID n'est pas explicitement indiqué mais peut être trouvé dans les HREF
//exemple: http://zonevideo.telequebec.tv/media/31304/episode-16/like-moi
$("div.thumbnail > a").each(function() {
    var element = $(this);
    //console.log("THUMBNAIL href:");
    //console.log(element.attr("href"));
    
    var results = element.attr("href").match("/media\\/[0-9]+/"); //should return an array of 1, containing "/media/31108/"

    if (results.length > 0)
    {
        var mediaId = results[0].split("/")[2];
        chrome.runtime.sendMessage({action:"add", mediaId:mediaId, episodeName:""});
        addButtonBefore($(this).parent(), "- TQ Downloader: Save this video -", {action:"download", mediaID:mediaId});
    }
});


$(".blockVideo").each(function() {
    //Look for this element
    //<video class="jw-video jw-reset" src="blob:http://zonevideo.telequebec.tv/b9246863-f529-43d6-b450-fa1808cf2a7d" jw-loaded="data" style="object-fit: fill;"></video>
    var element = $(this);
    var results = element[0].baseURI.match("/media\\/[0-9]+/"); //should return an array of 1, containing "/media/31108/"

    if (results.length > 0)
    {
        var mediaId = results[0].split("/")[2];
        addButtonAfter($(this), "- TQ Downloader: Save this video -", {action:"download", mediaID:mediaId});
    }
    
})