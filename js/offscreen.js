// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async msg => {
    console.log("MESSAGE RECIEVED");
    console.log(JSON.stringify(msg));
    if ('play' in msg) playAudio(msg.play);
});

// Play sound with access to DOM APIs
function playAudio({ source, volume, speed = 1.5 }) {
    console.log("[OFFSCREEN] Playing audio");
    const audio = new Audio(source);
    audio.volume = volume;
    audio.playbackRate = speed;
    audio.play();
}