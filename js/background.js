chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "descImg",
        title: "Describe",
        type: "normal",
        contexts: ["all"]
    });
});

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "describeImg") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const img = document.querySelector("img:hover");

                if (img) {
                    //console.log("IMG LINK: " + img.src);
                    let notif = new Audio(chrome.runtime.getURL("../sounds/waiting.mp3"));
                    notif.play();
                }


                var asticaAPI_endpoint = 'https://vision.astica.ai/describe';
                var asticaAPI_payload = {
                    tkn: '89C7CF6F-0E43-466B-83E9-9053A981B080256723A7AE75AD-AF4D-4552-9F4A-C2080FA1363D',  //visit https://astica.ai
                    modelVersion: '2.5_full', //1.0_full, 2.0_full, 2.1_full or 2.5_full
                    input: img.src, //https url or base64 encoded string
                    visionParams: 'gpt, describe, describe_all, tags, faces', //comma separated, leave blank for all. See below for more
                    gpt_prompt: '', // only used if visionParams includes "gpt" or "gpt_detailed"
                    prompt_length: 95, // number of words in GPT response
                    objects_custom_kw: '' // only used if visionParams includes "objects_custom" (v2.5_full or higher)
                };

                fetch(asticaAPI_endpoint, {
                    method: 'post',
                    body: JSON.stringify(asticaAPI_payload),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                }).then(response => response.json()) // convert to json
                    .then(data => { //print data to console
                        capt = data.caption_GPTS.replace(/"/g, '');
                        ////console.log("CAPT: " + capt);

                        const options = {
                            method: "POST",
                            headers: {
                                "xi-api-key": "sk_f8c04bd186b65b69427a24bb4bf016cfe925194a08666b4a",
                                "Content-Type": "application/json",
                                "Accept": "audio/mpeg",
                            },
                            body: `{"text":"${capt}","voice_settings":{"stability":0.55,"similarity_boost":0.75,"use_speaker_boost":true}}`,
                        };

                        fetch("https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17?output_format=mp3_22050_32", options)
                            .then(response => {
                                if (!response.ok) {
                                    return Promise.reject(`AN ERROR HAS APPEARED (${response.status}): ${JSON.stringify(response)}`);
                                }
                                return response.blob();
                            })
                            .then(audioBlob => {
                                ////console.log(audioBlob);
                                return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () =>
                                        resolve(`data:audio/mpeg;base64,${reader.result.split(",")[1]}`);
                                    reader.onerror = (error) => reject(error);
                                    reader.readAsDataURL(audioBlob);
                                });
                            })
                            .then(base64DataURL => {
                                //console.log("B64: " + base64DataURL);
                                let aud = new Audio(base64DataURL);
                                aud.playbackRate = 1.5;
                                aud.play();
                            })
                            .catch(error => {
                                //console.log("Error(s): " + error);
                            });

                    })
                    .catch(error => {
                        //console.log('More Error(s):', error)
                    });
            }
        });
    }
});

chrome.contextMenus.onClicked.addListener(async (callback) => {

    if (callback.mediaType == "image") {

        console.log("IMG: " + callback.srcUrl);
        await playSound("../sounds/waiting.mp3");

        let cap = await getDesc(callback.srcUrl);
        //console.log("Caption: " + cap);

        await speak(cap, 1.5);
    } else {
        //console.log("Not an image :(");
        playSound("../sounds/error.mp3", 0.5);
        //await playSound("https://file-examples.com/storage/fef4e75e176737761a179bf/2017/11/file_example_MP3_700KB.mp3");
    }
});

async function playSound(source = "../sounds/tone.mp3", volume = 1, speed = 1.5) {
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
    source = "https://www.astica.org/inputs/analyze_3.jpg"
) {
    var asticaAPI_endpoint = "https://vision.astica.ai/describe";
    var asticaAPI_payload = {
        tkn: "89C7CF6F-0E43-466B-83E9-9053A981B080256723A7AE75AD-AF4D-4552-9F4A-C2080FA1363D", //visit https://astica.ai
        modelVersion: "2.5_full", //1.0_full, 2.0_full, 2.1_full or 2.5_full
        input: "https://www.astica.org/inputs/analyze_3.jpg", //https url or base64 encoded string
        visionParams: "gpt, describe, describe_all, tags, faces", //comma separated, leave blank for all. See below for more
        gpt_prompt: "", // only used if visionParams includes "gpt" or "gpt_detailed"
        prompt_length: 95, // number of words in GPT response
        objects_custom_kw: "", // only used if visionParams includes "objects_custom" (v2.5_full or higher)
    };

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
        await playSound();

        //console.log("astica Vision AI Results:");
        //console.log(JSON.stringify(data));

        return data.caption_GPTS;
        /*
                handle individual data points:
                //console.log("Caption:", data.caption.text)
            */
    } catch (error) {
        // catch any errors
        playSound("../sounds/error.mp3");
        //console.log("Error:", error);
    }
}

async function speak(
    text = "This is a test and will be converted, by an AI, to clear and understandable human speech!",
    speed = 1.5
) {
    const options = {
        method: "POST",
        headers: {
            //'xi-api-key': 'sk_853b2007e7ffb6aa33733243c413d5814bf18cf00ea93e9e',
            "xi-api-key": "sk_f8c04bd186b65b69427a24bb4bf016cfe925194a08666b4a",
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
        },
        body: `{"text":"${text}","voice_settings":{"stability":0.55,"similarity_boost":0.75,"use_speaker_boost":true}}`,
    };

    try {
        let response = await fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17?output_format=mp3_22050_32",
            options
        );

        /*
            if (!response.ok) {
                throw new Error(`AN ERROR HAS APPEARED (${response.status}): ${JSON.stringify(response)}`);
            }
            */

        let audioBlob = await response.blob();
        //console.log(audioBlob);

        const base64DataURL = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
                resolve(`data:audio/mpeg;base64,${reader.result.split(",")[1]}`);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(audioBlob);
        });

        //console.log("B64: " + base64DataURL);
        await playSound(base64DataURL, 1, speed);
    } catch (error) {
        //console.log("err: " + error);
    }
}