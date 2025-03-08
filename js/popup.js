document.querySelector('#settings_button').addEventListener('click', function () {
    window.open(chrome.runtime.getURL('../html/settings.html'));
});

document.querySelector('#about_button').addEventListener('click', function () {
    window.open(chrome.runtime.getURL('../html/about.html'));
});