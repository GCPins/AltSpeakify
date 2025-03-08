document.querySelector('#settings_button').addEventListener('click', function () {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('../html/settings.html'));
      }
    //window.open(chrome.runtime.getURL('../html/settings.html'));
});

document.querySelector('#about_button').addEventListener('click', function () {
    window.open("https://github.com/GCPins/AltSpeakify");
});