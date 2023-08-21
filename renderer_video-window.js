const videoEl = document.querySelector('video');

electronAPI.onChangeVideo((event, { videoPath }) => {
    console.log(`Setting new video with path: ${videoPath}`);
    videoEl.src = videoPath;
});

electronAPI.onClearVideoSrc((event) => {
    console.log('Clearing video src');
    videoEl.src = '';
});
