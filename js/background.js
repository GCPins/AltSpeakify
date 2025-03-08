chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "descImg",
        title: "Describe",
        type: "normal",
        contexts: ["image"]
        //contexts: ["all"],
    });
});

chrome.contextMenus.onClicked.addListener(async (callback) => {
    console.log("IMG URL: " + callback.srcUrl);
});

chrome.commands.onCommand.addListener((cmd, tab) => {
    console.log(JSON.stringify(cmd));
});