const saveSettings = () => {
    console.log("Saving settings...");
    let asticaAPIkey = document.getElementById('astica-API-key').value;
    let labsAPIkey = document.getElementById('lab-API-key').value;

    console.log(asticaAPIkey, labsAPIkey);

    // if (asticaAPIkey === '' || labsAPIkey === '') {
    //     let status = document.getElementById('status');
    //     status.textContent = 'Failed to save options!';
    //     setTimeout(() => {
    //         status.textContent = ''
    //     }, 3000);
    //     return;
    // }

    document.getElementById('clear-button').disabled = false;
    document.getElementById('astValid').textContent = "";
    document.getElementById('labValid').textContent = "";
    chrome.storage.sync.set(
        { astkey: asticaAPIkey, labkey: labsAPIkey },
        () => {
            let status = document.getElementById('status');
            status.textContent = 'Options saved successfully!';
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        }
    )
    loadSettings();
}

const restoreOptions = () => {
    chrome.storage.sync.get(
        {astkey: '', labkey: ''},
        (items) => {
            let astAPIkey = document.getElementById('astica-API-key');
            let labAPIkey = document.getElementById('lab-API-key');
            console.log(items); 
            if ((!items.astkey) && (!items.labkey)) {
                console.log('test');
                document.getElementById('clear-button').disabled = true;
                document.getElementById('astValid').textContent = "ASTICA AI APIKEY NOT SET!";
                document.getElementById('labValid').textContent = "11LABS APIKEY NOT SET!";
                return;
            }
            document.getElementById('clear-button').disabled = false;
            document.getElementById('astValid').textContent = "";
            document.getElementById('labValid').textContent = "";
            if (!items.astkey) {
                document.getElementById('astValid').textContent = "ASTICA AI APIKEY NOT SET!";
            }
            if (!items.labkey) {
                document.getElementById('labValid').textContent = "11LABS APIKEY NOT SET!";
            }
            astAPIkey.value = items.astkey;
            labAPIkey.value = items.labkey;
        }
    )
}

const loadSettings = () => {
    console.log("Loading settings...");
    restoreOptions();
}

const revealPassAst = () => {
    let elem = document.getElementById('astica-API-key');
    if (elem.type === 'password') {
        elem.type = 'text';
    } else {
        elem.type = 'password';
    }
}

const revealPassLab = () => {
    let elem = document.getElementById('lab-API-key');
    console.log(elem);
    if (elem.type === 'password') {
        elem.type = 'text';
    } else {
        elem.type = 'password';
    }
}

const clearSettings = () => {
    console.log("Clearing settings...");
    document.getElementById('clear-button').disabled = true;
    document.getElementById('astValid').textContent = "ASTICA AI APIKEY NOT SET!";
    document.getElementById('labValid').textContent = "11LABS APIKEY NOT SET!";
    document.getElementById('astica-API-key').value = '';
    document.getElementById('lab-API-key').value = '';
    saveSettings();
}

document.getElementById('show-astica').addEventListener('click', revealPassAst);
document.getElementById('show-lab').addEventListener('click', revealPassLab);
document.getElementById('save-button').addEventListener('click', saveSettings);
document.getElementById('clear-button').addEventListener('click', clearSettings);

document.addEventListener('DOMContentLoaded', loadSettings);
