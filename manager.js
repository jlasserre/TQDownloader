
function downloadBashScript() {
  	
  $.get("./userdownloads/tqdownload_original.sh", function(data){
    let docContent = data;

    //if found, create file and start download
    let fileName = "./TQDownloader/tqdownload.sh";

    let doc = URL.createObjectURL( new Blob([docContent], {type: 'application/octet-binary'}) );    
    chrome.downloads.download({ url: doc, filename: fileName, conflictAction: 'overwrite', saveAs: false });    
  })
	
}

function downloadFFMpeg()
{
	//Downloading the ffmpeg is implemented differently than downloading the bash script
	//because it's a binary file. The other implementation yielded a file that was 
	//larger than the original and, obviously, not valid.
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/userdownloads/ffmpeg', true);
	xhr.responseType = 'blob';
	 
	xhr.onload = function(e) {
	  if (this.status == 200) {
	    // get binary data as a response
	    var blob = this.response;
	    let doc = URL.createObjectURL( blob );

	    let fileName = "./TQDownloader/ffmpeg";
		chrome.downloads.download({ url: doc, filename: fileName, conflictAction: 'overwrite', saveAs: false });    
	  }
	};
	 
	xhr.send();
}


document.addEventListener('DOMContentLoaded', function () {
	
	$("#DownloadBashScript").click(downloadBashScript);
	$("#DownloadFFMpeg").click(downloadFFMpeg);

});