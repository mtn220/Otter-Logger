const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const path = require('path');
const fs = require('fs/promises');

const videoFileExtensions = ['mp4', 'webm', 'ogg', 'ogv'];

let videoWindow = null;
let toolsWindow = null;

async function handleOpenVideoFolder(event) {
    const webContents = event.sender;
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (!canceled) {
            const folderPath = filePaths[0];

            const files = await fs.readdir(folderPath);
            const videos = files.filter((file) => {
                const extension = file.toLowerCase().split('.').pop();
                return videoFileExtensions.includes(extension);
            });

            webContents.send('video-folder-opened', {
                folderPath,
                videos,
            });
        }
    } catch (err) {
        console.error(err);
        return { error: err };
    }
}

async function handleChangeVideo(event, { folderPath, fileName }) {
    try {
        const videoPath = path.join(folderPath, fileName);
        const stats = await fs.stat(videoPath);
        videoWindow.webContents.send('change-video', { videoPath });
        toolsWindow.webContents.send('video-changed', {
            videoDateObj: stats.mtime,
        });
    } catch (err) {
        console.error(err);
        toolsWindow.webContents.send('video-changed', { error: err });
    }
}

function handleDataToClipboard(event, { toCopy }) {
    try {
        clipboard.writeText(toCopy);
        return { success: 1 };
    } catch (err) {
        return { success: 0, error: err };
    }
}

async function handleRenameFile(
    event,
    { oldName, newText, type, folderPath, retryCount = 0 }
) {
    try {
        if (retryCount >= 10) {
            throw new Error(
                'Error while renaming file in handleRenameFile. Reached max retries. Resource busy.'
            );
        }
        // Clear the video source from the current video so the video will stop being accessed while trying to rename the file
        videoWindow.webContents.send('clear-video-src');

        const extName = path.extname(oldName);
        const baseName = path.basename(oldName, extName);
        const separator = '_';
        let newName = '';
        switch (type) {
            case 'prepend':
                newName = newText + separator + oldName;
                break;
            case 'replace':
                newName = newText + extName;
                break;
            case 'append':
            default:
                newName = baseName + separator + newText + extName;
        }

        const oldPath = path.join(folderPath, oldName);
        const newPath = path.join(folderPath, newName);

        await fs.rename(oldPath, newPath);
        toolsWindow.webContents.send('file-renamed', {
            oldName,
            newName,
        });
    } catch (err) {
        if (err.code == 'EBUSY') {
            console.log("File busy, can't rename. Retrying in 500ms");
            setTimeout(
                () =>
                    handleRenameFile(event, {
                        oldName,
                        newText,
                        type,
                        folderPath,
                        retryCount: retryCount + 1,
                    }),
                500
            );
        } else {
            console.error('Error renaming file in handleRenameFile');
            console.error(err);
            toolsWindow.webContents.send('file-renamed', { error: err });
        }
    }
}

const createVideoWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_video-window.js'),
        },
    });
    win.loadFile('video-window.html');
    return win;
};
const createToolsWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_tools-window.js'),
        },
    });
    win.loadFile('tools-window.html');
    return win;
};

app.whenReady().then(() => {
    ipcMain.on('open-video-folder', handleOpenVideoFolder);
    ipcMain.on('change-video', handleChangeVideo);
    ipcMain.on('rename-file', handleRenameFile);
    ipcMain.on('open-dev-tools', (event) => {
        const webContents = event.sender;
        webContents.openDevTools();
    });
    ipcMain.handle('data-to-clipboard', handleDataToClipboard);

    videoWindow = createVideoWindow();
    toolsWindow = createToolsWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            videoWindow = createVideoWindow();
            toolsWindow = createToolsWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});