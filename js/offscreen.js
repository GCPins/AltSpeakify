// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async msg => {
    if ('play' in msg) playAudio(msg.play);
});

// Play sound with access to DOM APIs
function playAudio({ source, volume, speed = 1.5 }) {
    const audio = new Audio(source);
    audio.volume = volume;
    audio.playbackRate = speed;
    audio.play();
}