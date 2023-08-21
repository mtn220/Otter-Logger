let videoFolderPath = null;
let videoList = null;

const selectFolderButton = document.querySelector('#select-folder-button');
selectFolderButton.onclick = electronAPI.openVideoFolder;

const folderTextEl = document.querySelector('#folder-text-field');
const outputEl = document.querySelector('#otters-output');
const videoSelectorEl = document.querySelector('#video-selector');
videoSelectorEl.addEventListener('change', changeVideo);

const inputsNodeList = document.querySelectorAll('input');
const inputsObj = {};
inputsNodeList.forEach((node) => {
    if (node.id) {
        inputsObj[node.id] = node;
        node.addEventListener('input', updateOutput);
    }
});
document.querySelector('#copy-data-button').onclick = dataToClipboard;
document.querySelector('#next-video-button').onclick = handleNextVideo;
document.querySelector('#dev-tools-button').onclick = electronAPI.openDevTools;
document.querySelector('#append-button').onclick = handleAppend;
document.querySelector('#delete-button').onclick = handleDelete;
document.querySelector('#append-otter-button').onclick = () => {
    inputsObj['otters-description'].value = 'Otter';
};

function updateOutput() {
    let output = '<table><tr>';
    output += `<td>${inputsObj['otters-date'].value}</td><td>${inputsObj['otters-time'].value}</td>`;
    output += `<td>${inputsObj['otters-initials'].value}</td><td>${inputsObj['otters-site-code'].value}</td>`;
    output += `<td>${inputsObj['otters-num-otters'].value}</td><td>${inputsObj['otters-num-adults'].value}</td>`;
    output += `<td>${inputsObj['otters-num-pups'].value}</td><td>${inputsObj['otters-behavior'].value}</td>`;
    output += `<td>${inputsObj['otters-note'].value}</td></tr></table>`;
    outputEl.innerHTML = output;
}

function handleNextVideo() {
    videoSelectorEl.selectedIndex++;
    changeVideo();
}

function handleAppend() {
    const newText = inputsObj['otters-description'].value;
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
    const { success, error } = await electronAPI.dataToClipboard({
        toCopy: outputEl.innerHTML,
    });
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
        inputsObj['otters-num-otters'].value = '';
        inputsObj['otters-num-adults'].value = '';
        inputsObj['otters-num-pups'].value = '';
        inputsObj['otters-behavior'].value = '';
        inputsObj['otters-note'].value = '';
        inputsObj['otters-description'].value = '';
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
            videoList = videos;

            folderTextEl.innerText = folderPath;

            const newOptions = [];
            if (videoList.length > 0) {
                videoList.forEach((video) => {
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
    if (videoDateObj) {
        const year = videoDateObj.getFullYear();
        const month = (videoDateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = videoDateObj.getDate().toString().padStart(2, '0');
        inputsObj['otters-date'].value = `${year}-${month}-${day}`;

        const hours = videoDateObj.getHours().toString().padStart(2, '0');
        const minutes = videoDateObj.getMinutes().toString().padStart(2, '0');
        inputsObj['otters-time'].value = `${hours}-${minutes}-00`;
        updateOutput();
    }
});

electronAPI.onFileRenamed((event, { oldName, newName, error }) => {
    if (error) {
        console.error(error);
    } else {
        const options = Array.from(videoSelectorEl.options);
        changedOption = options.find((opt) => opt.value == oldName);
        if (changedOption) {
            changedOption.value = newName;
            changedOption.innerText = newName;
            handleNextVideo();
        } else {
            console.error(
                'Error updating select option after renaming file. Could not find option with old video name'
            );
            console.error(`oldName: ${oldName}\nnewName: ${newName}`);
        }
    }
});
