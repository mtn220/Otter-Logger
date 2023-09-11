const videoEl = document.querySelector('video');

electronAPI.onChangeVideo((event, { videoPath }) => {
    videoEl.src = videoPath;
});

electronAPI.onClearVideoSrc((event) => {
    videoEl.src = '';
});

electronAPI.onSetVideoCSS((event, { name, value }) => {
    videoEl.style[name] = value;
});
