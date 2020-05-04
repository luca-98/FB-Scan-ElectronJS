const { remote, ipcRender } = require('electron');
const fs = require('fs');
const boxScan = document.getElementById('box-scan');
const boxResult = document.getElementById('box-result');
const menuScan = document.getElementById('menu-scan');
const menuResult = document.getElementById('menu-result');
const fakeIP = document.getElementById('fake-ip');
const spanText = fakeIP.querySelector('span');
const scan_scaned = document.querySelector('#box-scan .scaned-item');
const result_scaned = document.querySelectorAll('#box-result .scaned-item');
const countTotal = document.getElementById('count-total');
const countSuccess = document.getElementById('count-success');
const countFailed = document.getElementById('count-failed');
const start = document.getElementById('start');
const thread = document.getElementById('thread');
const countProcess = document.querySelector(".processing");

let total = 0;
let success = 0;
let failed = 0;
let fakeIpIndex = 0;
let scanedIndex = 0;
let totalProxy = 0;
let numOfThread = 1;
let statusRunning = false;

document.getElementById('close').addEventListener('click', () => {
    remote.app.quit();
})
document.getElementById('minimize').addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
})
document.getElementById('menu-scan').addEventListener('click', ($event) => {
    selectMenu($event, 0)
})
document.getElementById('menu-result').addEventListener('click', ($event) => {
    selectMenu($event, 1)
})

thread.querySelectorAll("li").forEach(element => {
    element.addEventListener('click', ($event) => {
        changeStatusThreadText($event);
    })
});
fakeIP.querySelectorAll("li").forEach(element => {
    element.addEventListener('click', ($event) => {
        changeStatusFakeIpText($event);
    })
});

function setCountProcess(count) {
    if (count > 0) {
        countProcess.innerHTML = count + " emails in progress..."
    } else {
        countProcess.innerHTML = "";
    }

}

function changeStatusThreadText($event) {
    numOfThread = $event.target.dataset.thread;
    thread.querySelector("span").innerHTML = numOfThread;
}

function changeStatusFakeIpText($event) {
    fakeIpIndex = $event.target.dataset.fakeip;
    if (fakeIpIndex == 0) {
        spanText.innerHTML = 'Default';
    } else if (fakeIpIndex == 1) {
        spanText.innerHTML = 'Dcom';
    }
    else if (fakeIpIndex == 2) {
        spanText.innerHTML = 'Proxy (' + totalProxy + ')';
    }
}

function getNumOfThread() {
    return numOfThread;
}

function getFakeIpType() {
    return fakeIpIndex;
}

function getStatusRunning() {
    return statusRunning;
}


function setTotalProxy(total) {
    totalProxy = total;
    document.getElementById('selected-proxy').innerHTML = 'Proxy(' + total + ')';
}

function changeStatusButton() {
    statusRunning = !statusRunning;
    start.classList = {};
    if (statusRunning) {
        start.classList.add('running');
        start.innerHTML = 'Stop';
    } else {
        start.classList.add('start');
        start.innerHTML = 'Start';
    }
}



function selectMenu(event, index) {
    const listMenu = document.querySelectorAll('.left-box div[onclick]');
    for (const iterator of listMenu) {
        iterator.classList.remove('active');
    }
    event.target.classList.add('active');
    if (index == 0) {
        menuResult.classList.remove('active');
        menuScan.classList.add('active');
        boxResult.classList.add('disable');
        boxScan.classList.remove('disable');
    } else {
        menuScan.classList.remove('active');
        menuResult.classList.add('active');
        boxScan.classList.add('disable');
        boxResult.classList.remove('disable');
    }
}

function addScaned(email, info, status) {
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-10">1</li><li class="col-custom-50">luca</li><li class="col-custom-20 ">info</li><li class="col-custom-20 success">Success</li>';
    ul.children[0].innerHTML = ++scanedIndex;
    ul.children[1].innerHTML = email;
    ul.children[2].innerHTML = info.code ? info.code : info;
    ul.children[3].classList = {};
    if (status) {
        ul.children[3].innerHTML = 'Success';
        ul.children[3].classList = 'success';
    } else {
        ul.children[3].innerHTML = 'Failed';
        ul.children[3].classList = 'failed';
    }
    scan_scaned.appendChild(ul);
    scan_scaned.scrollTop = scan_scaned.scrollHeight;
    if (scan_scaned.childNodes.length > 150) {
        const max = scan_scaned.childNodes.length;
        for (let i = max; i >= 150; i--) {
            scan_scaned.removeChild(scan_scaned.firstElementChild);
        }
    }
}

function addResult(email, status) {
    countTotal.innerHTML = ++total;
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-20">1</li><li class="col-custom-50">luca</li><li class="col-custom-30 success">Success</li>';
    ul.children[1].innerHTML = email;
    ul.children[2].classList = {};
    if (status) {
        countSuccess.innerHTML = ++success;
        ul.children[0].innerHTML = success;
        ul.children[2].innerHTML = 'Success';
        ul.children[2].classList = 'success';
        result_scaned[0].appendChild(ul);
        result_scaned[0].scrollTop = result_scaned[0].scrollHeight;
        if (result_scaned[0].childNodes.length > 150) {
            result_scaned[0].removeChild(result_scaned[0].firstElementChild);
        }
        if (!fs.existsSync('success.txt')) {
            var createStream = fs.createWriteStream("success.txt");
            createStream.end();
        }
        fs.appendFile('success.txt', email + '\n', function (err, result) {
        });
    } else {
        countFailed.innerHTML = ++failed;
        ul.children[0].innerHTML = failed;
        ul.children[2].innerHTML = 'Failed';
        ul.children[2].classList = 'failed';
        result_scaned[1].appendChild(ul);
        result_scaned[1].scrollTop = result_scaned[1].scrollHeight;
        if (result_scaned[1].childNodes.length > 150) {
            result_scaned[1].removeChild(result_scaned[1].firstElementChild);
        }
    }
}


module.exports = {
    addScaned: addScaned,
    addResult: addResult,
    setTotalProxy: setTotalProxy,
    getStatusRunning: getStatusRunning,
    getFakeIpType: getFakeIpType,
    getNumOfThread: getNumOfThread,
    changeStatusButton: changeStatusButton,
    setCountProcess: setCountProcess
};

