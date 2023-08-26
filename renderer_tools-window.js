let videoFolderPath = null;
let videoData = [];

const folderTextEl = document.querySelector('#folder-text-field');
const outputEl = document.querySelector('#output');
const videoSelectorEl = document.querySelector('#video-selector');
videoSelectorEl.addEventListener('change', changeVideo);

const inputsNodeList = document.querySelectorAll('input');
const inputsObj = {};
inputsNodeList.forEach((node) => {
    if (node.id) {
        inputsObj[node.id] = node;
        node.addEventListener('input', updateData);
    }
});

const buttonsNodeList = document.querySelectorAll('button');
const buttonsObj = {};
buttonsNodeList.forEach((node) => {
    if (node.id) {
        buttonsObj[node.id] = node;
    }
});

buttonsObj['select-folder-button'].onclick = electronAPI.openVideoFolder;
buttonsObj['copy-data-button'].onclick = dataToClipboard;
buttonsObj['next-video-button'].onclick = handleNextVideo;
buttonsObj['append-button'].onclick = handleAppend;
buttonsObj['delete-button'].onclick = handleDelete;
buttonsObj['append-otter-button'].onclick = () => {
    inputsObj['description'].value = 'Otter';
};

function updateData() {
    const i = videoSelectorEl.selectedIndex;

    videoData[i].date = inputsObj['date'].value;
    videoData[i].time = inputsObj['time'].value;
    videoData[i].initials = inputsObj['initials'].value;
    videoData[i].siteCode = inputsObj['site-code'].value;
    videoData[i].numOtters = inputsObj['num-otters'].value;
    videoData[i].numAdults = inputsObj['num-adults'].value;
    videoData[i].numPups = inputsObj['num-pups'].value;
    videoData[i].behavior = inputsObj['behavior'].value;
    videoData[i].note = inputsObj['note'].value;
    updateOutput();
}

function updateOutput() {
    let output = '<table><tr>';
    output += `<td>${inputsObj['date'].value}</td><td>${inputsObj['time'].value}</td>`;
    output += `<td>${inputsObj['initials'].value}</td><td>${inputsObj['site-code'].value}</td>`;
    output += `<td>${inputsObj['num-otters'].value}</td><td>${inputsObj['num-adults'].value}</td>`;
    output += `<td>${inputsObj['num-pups'].value}</td><td>${inputsObj['behavior'].value}</td>`;
    output += `<td>${inputsObj['note'].value}</td></tr></table>`;
    outputEl.innerHTML = output;
}

function handleNextVideo() {
    videoSelectorEl.selectedIndex++;
    changeVideo();
}

function handleAppend() {
    const newText = inputsObj['description'].value;
    const oldName = videoSelectorEl.value;
    handleRename({ oldName, newText, type: 'append' });
}

function handleDelete() {
    const newText = 'DELETE';
    const oldName = videoSelectorEl.value;
    handleRename({ oldName, newText, type: 'prepend' });
}

function handleRename({ oldName, newText, type }) {
    if (!videoFolderPath) {
        console.error(
            'Error renaming file. No video folder specified. Please select a folder with video files in it.'
        );
    } else if (!oldName) {
        console.error(
            'Error renaming file. No old/original file name specified Make sure you have selected a video file.'
        );
    } else if (!newText) {
        console.error(
            'Error renaming file. No new text specified for renaming. Make sure you type something in the "What\'s in the video" field.'
        );
    } else if (!type) {
        console.error(
            'Error renaming file. No renaming type specified. Valid types: append, prepend, replace.'
        );
    } else {
        electronAPI.renameFile({
            oldName,
            newText,
            type,
            folderPath: videoFolderPath,
        });
    }
}

async function dataToClipboard() {
    let toCopy = `${inputsObj['date'].value}\t${inputsObj['time'].value}\t`;
    toCopy += `${inputsObj['initials'].value}\t${inputsObj['site-code'].value}\t`;
    toCopy += `${inputsObj['num-otters'].value}\t${inputsObj['num-adults'].value}\t`;
    toCopy += `${inputsObj['num-pups'].value}\t${inputsObj['behavior'].value}\t`;
    toCopy += `${inputsObj['note'].value}`;

    const { success, error } = await electronAPI.dataToClipboard({ toCopy });
    if (success) {
        console.log('success');
    } else {
        console.error(error);
    }
}

function changeVideo() {
    const newVideoName = videoSelectorEl.value;
    if (newVideoName) {
        electronAPI.changeVideo({
            folderPath: videoFolderPath,
            fileName: newVideoName,
        });
    }
}

// Set the function as the event handler for when the video folder is opened.
electronAPI.onVideoFolderOpened(
    async (event, { folderPath, videos, error }) => {
        if (error) {
            console.error(
                `Error getting video list and folder Path.\nError Details: ${error}`
            );
            folderTextEl.innerText = '';
        } else {
            videoFolderPath = folderPath;

            folderTextEl.innerText = folderPath;

            const newOptions = [];
            if (videos.length > 0) {
                videos.forEach((video, i) => {
                    videoData[i] = {
                        fileName: video,
                    };

                    let opt = document.createElement('option');
                    opt.value = video;
                    opt.innerText = video;
                    newOptions.push(opt);
                });
            } else {
                let opt = document.createElement('option');
                opt.value = '';
                opt.innerText = 'No video files in selected folder';
                newOptions.push(opt);
            }

            videoSelectorEl.replaceChildren(...newOptions);
        }
    }
);

electronAPI.onVideoChanged((event, { videoDateObj }) => {
    let parsedDate = '';
    let parsedTime = '';
    if (videoDateObj) {
        const year = videoDateObj.getFullYear();
        const month = (videoDateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = videoDateObj.getDate().toString().padStart(2, '0');
        parsedDate = `${year}-${month}-${day}`;

        const hours = videoDateObj.getHours().toString().padStart(2, '0');
        const minutes = videoDateObj.getMinutes().toString().padStart(2, '0');
        parsedTime = `${hours}-${minutes}-00`;
    }

    const index = videoSelectorEl.selectedIndex;

    inputsObj['date'].value = videoData[index].date || parsedDate;
    inputsObj['time'].value = videoData[index].time || parsedTime;
    inputsObj['initials'].value = videoData[index].initials || '';
    inputsObj['site-code'].value = videoData[index].siteCode || '';
    inputsObj['num-otters'].value = videoData[index].numOtters || '';
    inputsObj['num-adults'].value = videoData[index].numAdults || '';
    inputsObj['num-pups'].value = videoData[index].numPups || '';
    inputsObj['behavior'].value = videoData[index].behavior || '';
    inputsObj['note'].value = videoData[index].note || '';
    inputsObj['description'].value = videoData[index].description || '';

    updateOutput();
});

electronAPI.onFileRenamed((event, { oldName, newName, error }) => {
    if (error) {
        console.error(error);
    } else {
        const index = videoData.findIndex((video) => video.fileName == oldName);
        if (index >= 0) {
            // Update data
            videoData[index].fileName = newName;

            const options = Array.from(videoSelectorEl.options);
            options[index].value = newName;
            options[index].innerText = newName;
            handleNextVideo();
        } else {
            console.error(
                'Error updating select option after renaming file. Could not find option with old video name'
            );
            console.error(`oldName: ${oldName}\nnewName: ${newName}`);
        }
    }
});
