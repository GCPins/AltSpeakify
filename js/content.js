console.log("Hello from content! The page must be interacted with in order for this to work!");

let hasInteracted = false;

document.addEventListener('click', (event) => {
    hasInteracted = true;
})

document.addEventListener('mouseover', (event) => {
    const element = event.target;

    if (element.tagName === 'IMG' && hasInteracted) {
        console.log("image hovered!", element.src);
        const audio = new Audio(chrome.runtime.getURL("../sounds/tone.mp3"));
        audio.volume = 0.3;
        audio.play().catch(error => {
            console.error("Error playing the audio:", error);
        });
    }
})