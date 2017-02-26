
// INFORMATIONS UTILES
// Pour obtenir les liens vers les assets (images): 
// https://images.telequebec.tv/v1/list/livrables/161/default
//
// Pour obtenir info sur API images:
// https://images.telequebec.tv/
//
// Pour obtenir détails sur un media en particulier:
// https://mnmedias.api.telequebec.tv/api/v2/media/28176
//
// Pour obtenir la playlist m38u:
// https://mnmedias.api.telequebec.tv/m3u8/28176.m3u8
//
// Dans le fichier playlist M38U:
// l'URL pour downloader le video avec FFMPEG est dans le fichier M38U. On peut remplacer HTTPS par juste HTTP et ça marche bien avec FFMPEG.

// La command line pour downloader le media avec FFMPEG
//./ffmpeg -i "<M3U8 file>" -c copy filename.ts

//Dans l'API de chrome, il semble être possible d'utiliser chrome.downloads pour initier le download d'un fichier dans le répertoire Downloads
//ou un sous-répertoire de celui-ci... Il est même possible de faire "open" quand l'item a fini de downloader...

console.log("TeleQuebec Downloader loading.");

var tqDiscoveredMedia = [];

function DiscoveredMedia(mediaId, downloadM3U8Url)
{
  this.MediaId = mediaId;
  this.DownloadM3U8Url = downloadM3U8Url;
  this.MediaDownloadURl = "";
  this.ShowName = "";
  this.EpisodeName = "";
  this.EpisodeNo = "";
  this.SeasonNo = "";
  this.SeasonEpisodeNumber = "";
  this.MediaFileName = "";
  this.Title = "";
}

function RequestMediaDownloadUrl(mediaObject)
{
  $.get(mediaObject.DownloadM3U8Url)
    .done(function (data){
      InterpretMediaDownloadUrl(mediaObject, data);
    })
    .fail(function (data){
      //console.log("----fail");
      //console.log(data);

    })
    .always(function (data){
      //console.log("----always");
      //console.log(data);

    });
  //console.log("M3U8 file requested (" + mediaObject.downloadM3U8Url + ")");
};

function InterpretMediaDownloadUrl(mediaObject, data)
{
  var entries = [];
  entries = data.split("#");
  //console.log("Entries:");
  //console.log(entries);

  var maxBandwidth = 0;
  var rememberUrl = "";

  for (var i = 0; i < entries.length; i++) 
  {
    var entry = entries[i];
    //console.log("entry " + i + ":" + entry);
    
    var BWResult = /BANDWIDTH.\d+/.exec(entry);
    if (BWResult && BWResult.length > 0)
    {
      //console.log ("entry " + i + " BW : " + BWResult);
      var BWValue = parseInt(/[0-9]+/.exec(BWResult));
      
      //console.log("BWValue " + i + ":" + BWValue);
      if (maxBandwidth <= BWValue)
      {
        maxBandwidth = BWValue;
        rememberUrl = /http.+/.exec(entry).toString();
        //in my case, ffmpeg does not support HTTPS but for telequebec HTTP seems to work as well :)
        rememberUrl = rememberUrl.replace("https", "http");
        //console.log("URL:" + rememberUrl);
      }

    }

  }
  mediaObject.MediaDownloadURl = rememberUrl;
}

function DownloadFile(mediaId)
{
  //console.log("downloadFile " + mediaId);
  //find the mediaObject for the given mediaID
  var result = $.grep(tqDiscoveredMedia, function(e){ return e.MediaId === mediaId; });

  if (result.length > 0)
  {
    //console.log("found it, preparing file...");

    let mediaObject = result[0];
    //console.log(mediaObject);

    let docContent = "";

    for(var propertyName in mediaObject) 
    {
        docContent += propertyName + "=" + mediaObject[propertyName] + "\n";
    }


    //if found, create file and start download
    let fileName = "./TQDownloader/" + mediaObject.MediaFileName + ".tqd";

    let doc = URL.createObjectURL( new Blob([docContent], {type: 'application/octet-binary'}) );
    
    chrome.downloads.download({ url: doc, filename: fileName, conflictAction: 'overwrite', saveAs: false });
     
  }
  else
  {
    console.log("Can't find " + mediaId + ". no download!");
  }
}


function MakeFileSystemFriendly(desiredFileName)
{
  var outputFileName = desiredFileName.trim();

  outputFileName = outputFileName.replace(/[\/]/gi, '-');
  //outputFileName = camelize(outputFileName.replace(/[^a-z\-0-9]/gi, ' '));

  return outputFileName;
}

function DownloadAll()
{
  let mediaObjects = tqDiscoveredMedia;
  
  for (var i = 0; i < mediaObjects.length; i++) 
  {
    //INDEED!! This is kinda stupid and lazy: DownloadFile() will use the
    //mediaId to find the mediaobject in the tqDiscoveredMedia array... 
    //We should pass the object right here. TODO.
    DownloadFile(mediaObjects[i].MediaId);
  }
}

function AddMedia(mediaId)
{
  //make sure the mediaId is stopred as a string...
  mediaId = "" + parseInt(mediaId);

  //console.log("AddMedia("+mediaId+")");
  //Do we already have a media object for this mediaId ?
  var result = $.grep(tqDiscoveredMedia, function(e){ return e.MediaId === mediaId; });

  if(result.length > 0)
  {
    //console.log("Media " + mediaId + " already exists. Not Adding.");
  }
  else
  {
    console.log("TQDownloader - Discovered media " + mediaId + "!");
    var downloadM3U8Url = "https://mnmedias.api.telequebec.tv/m3u8/" + mediaId + ".m3u8";
    var newDiscovereMedia = new DiscoveredMedia(mediaId, downloadM3U8Url)
    tqDiscoveredMedia.push(newDiscovereMedia);
    //console.log("ADDED " + mediaId + " to tqDiscoveredMedia");
    //console.log(tqDiscoveredMedia);

    RequestMediaDownloadUrl(newDiscovereMedia);
    getMediaDetails(newDiscovereMedia.MediaId);
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    //console.log("Message: ");
    //console.log(request);
    //console.log(sender.tab ?
    //        "from a content script:" + sender.tab.url :
   //         "from the extension");

    if (request.action === "add")
    {
      AddMedia(request.mediaId);

    }
    else if (request.action === "download")
    {
      DownloadFile(request.mediaID);
      sendResponse({result: "success", request: request.action, mediaID:request.mediaID});
    }
  });

function getMediaDetails(mediaId)
{
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
//https://mnmedias.api.telequebec.tv/api/v2/media/?page=3&pageSize=200
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
//WHOAAAHHHHH This undocumented API seems to provide ALL the available media...
//https://mnmedias.api.telequebec.tv/api/v2/media/?page=3&pageSize=200
//notice the arguments "page" which can be incremented to get the Nth page or results
//and pageSize to get 100 or 200 (or whatever) amount of results. (avoid too large numbers. 200 already takes a few seconds to receive full results)
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


  var TQAPI_Medias = "https://mnmedias.api.telequebec.tv/api/v2/media/";

  $.getJSON( TQAPI_Medias + mediaId, function( data ) 
    {
      var foundMediaObject = $.grep(tqDiscoveredMedia, function(e){ return e.MediaId === mediaId; });

      if (foundMediaObject.length > 0)
      {
        let discoveredMedia = foundMediaObject[0];
     
        //console.log(data.media);
        if (data.media)
        {
          var TQMediaObject = data.media;

          discoveredMedia.ShowName = TQMediaObject.category.container.friendlyUrl;
          discoveredMedia.EpisodeName = TQMediaObject.friendlyUrl;


          if (TQMediaObject.product)
          {
            discoveredMedia.EpisodeNo = ("0" + TQMediaObject.product.episodeNo).slice(-2);

            if(TQMediaObject.product.season)
            {
              discoveredMedia.SeasonNo = ("0" + TQMediaObject.product.season.seasonNo).slice(-2); //format with leading "0"
              discoveredMedia.SeasonEpisodeNumber= "S" + discoveredMedia.SeasonNo + "E" + discoveredMedia.EpisodeNo;
            }            
          }
          discoveredMedia.MediaFileName = TQMediaObject.fileName;
          discoveredMedia.Title = TQMediaObject.title;
        }
      }
    });
}


////////////////////////////////////////////////////////////////////////////////////////// 
// Show the extension's HTML page when user clicks on browser action icon
function focusOrCreateTab(url) {
  chrome.windows.getAll({"populate":true}, function(windows) {
    //console.log("Looking for " + url);
    var existing_tab = null;
    for (var i in windows) {
      var tabs = windows[i].tabs;
      for (var j in tabs) {
        var tab = tabs[j];
        //console.log("\tFound: " + tab.url);
        if (tab.url == url) {
          //console.log("FOUND IT");
          existing_tab = tab;
          break;
        }
      }
    }
    if (existing_tab) {
      chrome.tabs.update(existing_tab.id, {"selected":true});
    } else {
      chrome.tabs.create({"url":url, "selected":true});
    }
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  //console.log("SHOW MANAGER PAGE");
  var manager_url = chrome.extension.getURL("manager.html");
  focusOrCreateTab(manager_url);
});


//////////////////////////////////////////////////////////////////////////////////////////
// Add a listener to intercept queries made to TQ's database:
// anything of this form is relevant: https://mnmedias.api.telequebec.tv/api/v2/media/31641
function GetLocation(href)
 {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

var filter = {urls:["*://mnmedias.api.telequebec.tv/api/v2/media/*"]};
var opt_extraInfoSpec = [];


chrome.webRequest.onBeforeRequest.addListener(function (details) {
  //console.log("Detected request to : "+ details.url);

  var mediaId = details.url.split("/media/").pop();
  
  if ((/[0-9]+/).test(mediaId))
  {
    //console.log("TQD detected query to: " + details.url);
    //console.log("TQD: mediaId = " + mediaId);
    AddMedia(mediaId);
  }
  else
  {
    //console.log("MediaId "+ mediaId + " is not a number! Ignoring.");
  }

}, filter, opt_extraInfoSpec)
//////////////////////////////////////////////////////////////////////////////////////////

console.log("TeleQuebec Downloader loaded.");

