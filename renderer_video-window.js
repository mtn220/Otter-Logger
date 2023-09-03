const videoEl = document.querySelector('video');

electronAPI.onChangeVideo((event, { videoPath }) => {
    videoEl.src = videoPath;
});

electronAPI.onClearVideoSrc((event) => {
    videoEl.src = '';
});
