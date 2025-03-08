chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "descImg",
        title: "Describe",
        type: "normal",
        contexts: ["all"]
    });
});

chrome.commands.onCommand.addListener((command, tab) => {

    // this doesn't work lol. thanks v3.
    if (command === "stopAudio") {
        console.log("STOP AUDIO!");
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const audios = document.querySelectorAll('audio');
                audios.forEach(aud => {
                    console.log("passing an audio:" + aud);
                    aud.pause();
                    aud.currentTime = 0;
                });
            }
        });
    }

    if (command === "describeImg") {

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const img = document.querySelector("img:hover");
                if (!img) {
                    console.log("NOT AN IMAGE!");
                    let notif = new Audio(chrome.runtime.getURL("../sounds/error.mp3"));
                    notif.volume = 0.5;
                    notif.play();
                    return;
                }
                if (img) {
                    let notif = new Audio(chrome.runtime.getURL("../sounds/waiting.mp3"));
                    notif.volume = 0.5;
                    notif.play();
                }

                let astKey;
                let labKey;
                let voiceID;
                chrome.storage.sync.get(
                    { astkey: '', labkey: '', voiceid: '' },
                    (items) => {
                        astKey = items.astkey;
                        labKey = items.labkey;
                        voiceID = items.voiceid;

                        console.log(astKey, labKey, voiceID);
                        if (!astKey || !labKey) {
                            console.log("NO API KEYS! Cannot play audio!");
                            let errNot = new Audio(chrome.runtime.getURL("../sounds/error.mp3"));
                            errNot.volume = 0.5;
                            errNot.play();
                            return;
                        }

                        var asticaAPI_endpoint = 'https://vision.astica.ai/describe';
                        var asticaAPI_payload = {
                            tkn: 'changeme',
                            modelVersion: '2.5_full', //1.0_full, 2.0_full, 2.1_full or 2.5_full
                            input: img.src, //https url or base64 encoded string
                            visionParams: 'gpt, describe, describe_all, tags, faces', //comma separated, leave blank for all. See below for more
                            gpt_prompt: '', // only used if visionParams includes "gpt" or "gpt_detailed"
                            prompt_length: 95, // number of words in GPT response
                            objects_custom_kw: '' // only used if visionParams includes "objects_custom" (v2.5_full or higher)
                        };
                        asticaAPI_payload.tkn = astKey;
                        console.log("asticaAPI:", JSON.stringify(asticaAPI_payload));

                        fetch(asticaAPI_endpoint, {
                            method: 'post',
                            body: JSON.stringify(asticaAPI_payload),
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            mode: 'cors'
                        }).then(response => response.json())
                            .then(data => {
                                capt = data.caption_GPTS.replace(/"/g, '');

                                const options = {
                                    method: "POST",
                                    headers: {
                                        "xi-api-key": "changeme",
                                        "Content-Type": "application/json",
                                        "Accept": "audio/mpeg",
                                    },
                                    body: `{"text":"${capt}","voice_settings":{"stability":0.55,"similarity_boost":0.75,"use_speaker_boost":true}}`,
                                };
                                options.headers["xi-api-key"] = labKey;
                                console.log("11labs: ", JSON.stringify(options.headers));

                                let finalVoiceID;
                                if (!voiceID) {
                                    finalVoiceID = 'CwhRBWXzGAHq8TQ4Fs17';
                                } else {
                                    finalVoiceID = voiceID;
                                }
                                fetch("https://api.elevenlabs.io/v1/text-to-speech/" + finalVoiceID + "?output_format=mp3_22050_32", options)
                                    .then(response => {
                                        if (!response.ok) {
                                            return Promise.reject(`AN ERROR HAS APPEARED (${response.status}): ${JSON.stringify(response)}`);
                                        }
                                        return response.blob();
                                    })
                                    .then(audioBlob => {
                                        return new Promise((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = () =>
                                                resolve(`data:audio/mpeg;base64,${reader.result.split(",")[1]}`);
                                            reader.onerror = (error) => reject(error);
                                            reader.readAsDataURL(audioBlob);
                                        });
                                    })
                                    .then(base64DataURL => {
                                        let aud = new Audio(base64DataURL);
                                        aud.playbackRate = 1.5;
                                        aud.play();
                                    })
                                    .catch(error => {
                                        console.log("Error(s): " + error);
                                    });

                            })
                            .catch(error => {
                                console.log('More Error(s):', error)
                            });
                    })
            }
        });
    }
});

async function loadSavedOpt() {
    const items = await chrome.storage.sync.get({ astkey: '', labkey: '', voiceid: '' });

    let astKey = items.astkey;
    let labKey = items.labkey;
    let voiceID = items.voiceid;

    console.log(astKey, labKey, voiceID);

    if (!astKey || !labKey) {
        console.log("NO API KEYS! Cannot play audio!");
        return { 'astKey': '', 'labKey': '', 'voiceId': '' };
    }

    return { 'astKey': astKey, 'labKey': labKey, 'voiceId': voiceID };
}

chrome.contextMenus.onClicked.addListener(async (callback) => {

    if (callback.mediaType == "image") {

        console.log("IMG: " + callback.srcUrl);
        await playSound("../sounds/waiting.mp3", 0.5, 1);

        let tknObj = await loadSavedOpt();
        console.log("api keys:", JSON.stringify(tknObj));
        let astKey = tknObj.astKey;
        let labKey = tknObj.labKey;
        let voice_id = tknObj.voiceId;

        let cap = await getDesc(callback.srcUrl, astKey);
        await speak(cap, 1.5, labKey, voice_id);
    } else {
        playSound("../sounds/error.mp3", 0.5);
    }
});

async function playSound(source = "../sounds/tone.mp3", volume = 0.3, speed = 1.5) {
    await createOffscreen();
    console.log("playing sound");
    await chrome.runtime.sendMessage({ play: { source, volume, speed } });
}

// Create the offscreen document if it doesn't already exist
async function createOffscreen() {
    if (await chrome.offscreen.hasDocument()) {
        return;
    }
    await chrome.offscreen.createDocument({
        url: "../html/offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Audio playback (AltSpeakify)..."
    });
}

async function getDesc(
    source = "https://www.astica.org/inputs/analyze_3.jpg", apikey = ''
) {
    var asticaAPI_endpoint = "https://vision.astica.ai/describe";
    var asticaAPI_payload = {
        tkn: 'changeme',
        modelVersion: "2.5_full", //1.0_full, 2.0_full, 2.1_full or 2.5_full
        input: "https://www.astica.org/inputs/analyze_3.jpg", //https url or base64 encoded string
        visionParams: "gpt, describe, describe_all, tags, faces", //comma separated, leave blank for all. See below for more
        gpt_prompt: "", // only used if visionParams includes "gpt" or "gpt_detailed"
        prompt_length: 95, // number of words in GPT response
        objects_custom_kw: "", // only used if visionParams includes "objects_custom" (v2.5_full or higher)
    };
    asticaAPI_payload.tkn = apikey;

    asticaAPI_payload.input = source;
    try {
        const response = await fetch(asticaAPI_endpoint, {
            method: "post",
            body: JSON.stringify(asticaAPI_payload),
            headers: {
                "Content-Type": "application/json",
            },
            mode: "cors",
        });

        if (!response.ok) {
            playSound("../sounds/error.mp3");
            throw new Error(`HTTP ERROR: ${response.status}`);
        }

        const data = await response.json();
        //await playSound();

        console.log(JSON.stringify(data.caption_GPTS));

        return data.caption_GPTS;

    } catch (error) {
        // catch any errors
        playSound("../sounds/error.mp3");
    }
}

async function speak(
    text = "This is a placeholder, and will be converted, by an AI, to clear and understandable human speech!",
    speed = 1.5,
    apikey = '',
    voice_id = 'CwhRBWXzGAHq8TQ4Fs17'
) {
    const options = {
        method: "POST",
        headers: {
            "xi-api-key": "changeme",
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
        },
        body: `{"text":"${text}","voice_settings":{"stability":0.55,"similarity_boost":0.75,"use_speaker_boost":true}}`,
    };
    options.headers["xi-api-key"] = apikey;

    try {
        let response = await fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/" + voice_id + "?output_format=mp3_22050_32",
            options
        );

        let audioBlob = await response.blob();

        const base64DataURL = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
                resolve(`data:audio/mpeg;base64,${reader.result.split(",")[1]}`);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(audioBlob);
        });

        await playSound(base64DataURL, 1, speed);
    } catch (error) {
        console.log("err: " + error);
    }
}