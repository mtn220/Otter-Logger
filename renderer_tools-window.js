let videoFolderPath = null;
let videoData = [];

const folderTextDiv = document.querySelector('#folder-text-field');
const outputDiv = document.querySelector('#output');
const alertsContainer = document.querySelector('#alerts-container');
const videoSelector = document.querySelector('#video-selector');
videoSelector.addEventListener('change', changeVideo);

const inputsNodeList = document.querySelectorAll('input');
const inputsObj = {};
inputsNodeList.forEach((node) => {
    if (node.id) {
        inputsObj[node.id] = node;
        if (node.id != 'file-name' && node.type == 'text') {
            node.addEventListener('input', updateData);
        }
    }
});
inputsObj['file-name'].addEventListener('input', handleFileNameInput);
inputsObj['brightness-slider'].addEventListener('input', (event) => {
    electronAPI.setVideoCSS({
        name: 'filter',
        value: `brightness(${event.target.value}%)`,
    });
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
buttonsObj['prev-video-button'].onclick = handlePrevVideo;
buttonsObj['append-button'].onclick = handleAppend;
buttonsObj['delete-button'].onclick = handleDelete;
buttonsObj['first-last-button'].onclick = markFirstLast;
buttonsObj['append-otter-button'].onclick = () => {
    inputsObj['description'].value = 'Otter';
};
buttonsObj['reset-file-name-button'].onclick = () => {
    const index = videoSelector.selectedIndex;
    inputsObj['file-name'].value = videoData[index].fileName;
    handleFileNameInput();
};
buttonsObj['change-file-name-button'].onclick = () => {
    const index = videoSelector.selectedIndex;
    const oldName = videoData[index].fileName;
    const newText = inputsObj['file-name'].value;
    handleRename({ oldName, newText, type: 'replace' });
};
buttonsObj['reset-brightness-button'].onclick = () => {
    inputsObj['brightness-slider'].value = 100;
    electronAPI.setVideoCSS({
        name: 'filter',
        value: 'brightness(100%)',
    });
};

function appendAlert(message, type) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>',
    ].join('');

    alertsContainer.append(wrapper);
}

function errorAlert(message) {
    appendAlert(message, 'danger');
}

function updateData() {
    const index = videoSelector.selectedIndex;
    if (index >= 0 && videoData.length > 0) {
        videoData[index].date = inputsObj['date'].value;
        videoData[index].time = inputsObj['time'].value;
        videoData[index].initials = inputsObj['initials'].value;
        videoData[index].siteCode = inputsObj['site-code'].value;
        videoData[index].numOtters = inputsObj['num-otters'].value;
        videoData[index].numAdults = inputsObj['num-adults'].value;
        videoData[index].numPups = inputsObj['num-pups'].value;
        videoData[index].behavior = inputsObj['behavior'].value;
        videoData[index].note = inputsObj['note'].value;
        updateOutput();
    }
}

function updateOutput() {
    let output = '<table><tr>';
    output += `<td>${inputsObj['date'].value}</td><td>${inputsObj['time'].value}</td>`;
    output += `<td>${inputsObj['initials'].value}</td><td>${inputsObj['site-code'].value}</td>`;
    output += `<td>${inputsObj['num-otters'].value}</td><td>${inputsObj['num-adults'].value}</td><td></td>`;
    output += `<td>${inputsObj['num-pups'].value}</td><td>${inputsObj['behavior'].value}</td>`;
    output += `<td>${inputsObj['note'].value}</td></tr></table>`;
    outputDiv.innerHTML = output;
}

function handleFileNameInput() {
    const index = videoSelector.selectedIndex;
    if (index >= 0 && videoData.length > 0) {
        const actualFileName = videoData[index].fileName;
        const inputFileName = inputsObj['file-name'].value;
        if (inputFileName != actualFileName) {
            buttonsObj['change-file-name-button'].disabled = false;
            buttonsObj['reset-file-name-button'].disabled = false;
        } else {
            buttonsObj['change-file-name-button'].disabled = true;
            buttonsObj['reset-file-name-button'].disabled = true;
        }
    }
}

function handleNextVideo() {
    if (videoSelector.selectedIndex < videoData.length - 2) {
        videoSelector.selectedIndex++;
    }
    changeVideo();
}
function handlePrevVideo() {
    if (videoSelector.selectedIndex > 0) {
        videoSelector.selectedIndex--;
    }
    changeVideo();
}

function handleAppend() {
    const newText = inputsObj['description'].value;
    const oldName = videoSelector.value;
    handleRename({ oldName, newText, type: 'append', changeToNextVideo: true });
}

function handleDelete() {
    const newText = 'DELETE';
    const oldName = videoSelector.value;
    handleRename({
        oldName,
        newText,
        type: 'prepend',
        changeToNextVideo: true,
    });
}

function handleRename({
    oldName,
    newText,
    type,
    futureArgs,
    changeToNextVideo,
}) {
    if (!videoFolderPath) {
        errorAlert(
            'Error renaming file. No video folder specified. Please select a folder with video files in it.'
        );
    } else if (!oldName) {
        errorAlert(
            'Error renaming file. No old/original file name specified Make sure you have selected a video file.'
        );
    } else if (!newText) {
        errorAlert(
            'Error renaming file. No new text specified for renaming. Make sure you type something in the "What\'s in the video" field.'
        );
    } else if (!type) {
        errorAlert(
            'Error renaming file. No renaming type specified. Valid types: append, prepend, replace.'
        );
    } else {
        electronAPI.renameFile({
            oldName,
            newText,
            type,
            folderPath: videoFolderPath,
            futureArgs,
            changeToNextVideo,
        });
    }
}

function markFirstLast() {
    if (videoData.length > 0) {
        const firstOldName = videoData[0].fileName;
        const lastOldName = videoData[videoData.length - 1].fileName;

        handleRename({
            oldName: firstOldName,
            newText: 'FirstVideo',
            type: 'append',
            futureArgs: [
                {
                    oldName: lastOldName,
                    newText: 'LastVideo',
                    type: 'append',
                },
            ],
        });
    } else {
        errorAlert('Error marking first & last. Select video folder first.');
        return;
    }
}

async function dataToClipboard() {
    let toCopy = `${inputsObj['date'].value}\t${inputsObj['time'].value}\t`;
    toCopy += `${inputsObj['initials'].value}\t${inputsObj['site-code'].value}\t`;
    toCopy += `${inputsObj['num-otters'].value}\t${inputsObj['num-adults'].value}\t\t`;
    toCopy += `${inputsObj['num-pups'].value}\t${inputsObj['behavior'].value}\t`;
    toCopy += `${inputsObj['note'].value}`;

    const { success, error } = await electronAPI.dataToClipboard({ toCopy });
    if (success) {
        console.log('success');
    } else {
        errorAlert(error);
    }
}

function changeVideo() {
    const newVideoName = videoSelector.value;
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
            errorAlert(
                `Error getting video list and folder Path.\nError Details: ${error}`
            );
            folderTextDiv.innerText = '';
        } else {
            videoFolderPath = folderPath;

            folderTextDiv.innerText = folderPath;

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

            videoSelector.replaceChildren(...newOptions);
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

    const index = videoSelector.selectedIndex;
    videoData[index].date = videoData[index].date || parsedDate;
    videoData[index].time = videoData[index].time || parsedTime;

    inputsObj['date'].value = videoData[index].date;
    inputsObj['time'].value = videoData[index].time;
    inputsObj['initials'].value =
        videoData[index].initials || inputsObj['initials'].value || '';
    inputsObj['site-code'].value =
        videoData[index].siteCode || inputsObj['site-code'].value || '';
    inputsObj['num-otters'].value = videoData[index].numOtters || '';
    inputsObj['num-adults'].value = videoData[index].numAdults || '';
    inputsObj['num-pups'].value = videoData[index].numPups || '';
    inputsObj['behavior'].value = videoData[index].behavior || '';
    inputsObj['note'].value = videoData[index].note || '';
    inputsObj['description'].value = videoData[index].description || '';
    inputsObj['file-name'].value = videoData[index].fileName;

    handleFileNameInput();
    updateOutput();
});

electronAPI.onFileRenamed(
    (event, { oldName, newName, futureArgs, changeToNextVideo, error }) => {
        if (error) {
            errorAlert(error);
        } else {
            const index = videoData.findIndex(
                (video) => video.fileName == oldName
            );
            if (index >= 0 && videoData.length > 0) {
                // Update data
                videoData[index].fileName = newName;

                const options = Array.from(videoSelector.options);
                options[index].value = newName;
                options[index].innerText = newName;
                if (futureArgs && futureArgs.length > 0) {
                    const nextArgs = futureArgs.shift();
                    handleRename({ ...nextArgs, futureArgs });
                } else if (changeToNextVideo) {
                    handleNextVideo();
                } else {
                    changeVideo();
                }
            } else {
                errorAlert(
                    'Error updating select option after renaming file. Could not find option with old video name'
                );
                errorAlert(`oldName: ${oldName}\nnewName: ${newName}`);
            }
        }
    }
);
