ffmpegPath="."
outputPath="./media"
outputExtension="mov"

#this script should run in the same folder than the TQD files
sourcePath="."

MediaId=""
MediaDownloadURl=""
ShowName=""
EpisodeName=""
EpisodeNo=""
SeasonNo=""
SeasonEpisodeNumber=""
MediaFileName=""
Title=""
	

echo "****************************************************************"
echo "****************************************************************"
echo "****************  TQDownloader download script  ****************"
echo "**"
echo "** Source:"
echo "**  $sourcePath"
echo "** FFMPEG:"
echo "**  $ffmpegPath"
echo "** Output:"
echo "**  $outputPath"

if [ ! -d $outputPath ]
	then
	echo "Creating output path: $outputPath"
	mkdir "$outputPath"
fi

if test -d ./done
then
	echo ""
else
	mkdir ./done
	echo "****************************************************************"
	echo "** Created 'done' folder to store completed files"
	echo "**"
fi

chmod +x "$ffmpegPath"/ffmpeg

echo "****************************************************************"
echo "** Gathering files from : $sourcePath"
echo "**"

#This script uses two nested loops to ensure that
#if any file is added or deleted while looping through
#the files in the source folder, the script will
#adapt and only handle existing files.

foundAtLeastOneFile=true
while $foundAtLeastOneFile
do
foundAtLeastOneFile=false

#the next line is to make sure that the loop won't be executed
#if there are no files in the directory. Otherwise, the value
#of $file would have been "*.tmp" if there were no files that
#that matched.
shopt -s nullglob

#this is the inner loop, but it'll actually only be executed once
#because there is a break at the end. Basically, this loop only
#handles the first file returned by *.tmp.
for file in "$sourcePath"/*.tqd
do

fileName=$(basename "$file" .tqd)
echo ""
echo ""
echo "****************************************************************"
echo "****************************************************************"
echo "****************************************************************"
echo "** Analyzing:"
echo "**  $fileName.tqd"
echo "**"

mv "$file" "$file.wip"
#check if rename was succesful
if [ $? -ne 0 ]
then
    echo "** ERROR: Could not rename $fileName. Skipping to next available file."
    break;
fi

file="$file".wip

IFS="="
while read -r name value
do
#echo "Content of $name is ${value//\"/}"
if [ "$name" == "ShowName" ];then
ShowName=$value
elif [ "$name" == "MediaId" ]; then
MediaId=$value
elif [ "$name" == "MediaDownloadURl" ]; then
MediaDownloadURl=$value
elif [ "$name" == "EpisodeName" ]; then
EpisodeName=$value
elif [ "$name" == "EpisodeNo" ]; then
EpisodeNo=$value
elif [ "$name" == "SeasonNo" ]; then
SeasonNo=$value
elif [ "$name" == "SeasonEpisodeNumber" ]; then
SeasonEpisodeNumber=$value
elif [ "$name" == "MediaFileName" ]; then
MediaFileName=$value
elif [ "$name" == "Title" ]; then
Title=$value
fi
done < "$file"

echo "** ShowName:"
echo "**  $ShowName"
echo "** MediaId:"
echo "**  $MediaId"
echo "** MediaDownloadURl:"
echo "**  $MediaDownloadURl"
echo "** EpisodeName:"
echo "**  $EpisodeName"
echo "** EpisodeNo:"
echo "**  $EpisodeNo"
echo "** SeasonNo:"
echo "**  $SeasonNo"
echo "** SeasonEpisodeNumber:"
echo "**  $SeasonEpisodeNumber"
echo "** MediaFileName:"
echo "**  $MediaFileName"
echo "** Title:"
echo "**  $Title"
echo "**"

outputFinalFolder="$outputPath/$ShowName"
outputFinalFilename="$SeasonEpisodeNumber""_$EpisodeName"."$outputExtension"
echo "***************************************************************"
echo "** Creating:"
echo "**  $ShowName/$outputFinalFilename"
echo "**"

if test -d "$outputFinalFolder"
then
echo ""
else
echo "** Creating output folder:"
echo "**  $ShowName"
mkdir "$outputFinalFolder"
fi

#NOTES: Here are a few interesting parameters for ffmpeg:
#		  -loglevel loglevel  set logging level
#		  -v loglevel         set logging level
#         -metadata string=string  add metadata

echo "***************************************************************"
echo "** Downloading!"
"$ffmpegPath"/ffmpeg -v warning -i "$MediaDownloadURl" -n -c copy "$outputFinalFolder"/"$outputFinalFilename"

mv "$file" "$sourcePath/done/$fileName.tqd.done"

#if we reach this line, we processed one file. Make sure to 
#exit the inner loop to perform an all new file listing query.
foundAtLeastOneFile=true
break
done

done

echo "****************************************************************"
echo "****************************************************************"
echo "*****************  TQDownloader : COMPLETED  *******************"
echo "****************************************************************"
echo "****************************************************************"
echo ""
echo ""
