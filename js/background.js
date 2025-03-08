chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "descImg",
        title: "Describe",
        type: "normal",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener(async (callback) => {
    console.log("IMG URL: " + callback.srcUrl);
});

chrome.commands.onCommand.addListener((command, tab) => {
    console.log(JSON.stringify(command));
    console.log(JSON.stringify(tab));
});