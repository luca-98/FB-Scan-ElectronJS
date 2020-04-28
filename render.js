const { remote, ipcRender } = require('electron');

"use strict";
const request = require('request-promise');
const cheerio = require('cheerio');
const Worker = require("./worker");
const FakeIp = require("./fake-ip-dcom");
const boxScan = document.getElementById('box-scan');
const boxResult = document.getElementById('box-result');
const menuScan = document.getElementById('menu-scan');
const menuResult = document.getElementById('menu-result');
const start = document.getElementById('start');
const fakeIP = document.getElementById('fake-ip');
const spanText = fakeIP.querySelector('span');
const scan_scaned = document.querySelector('#box-scan .scaned-item');
const result_scaned = document.querySelectorAll('#box-result .scaned-item');
const countTotal = document.getElementById('count-total');
const countSuccess = document.getElementById('count-success');
const countFailed = document.getElementById('count-failed');
const fs = require('fs');

let total = 0;
let success = 0;
let failed = 0;
let status = false;
let indexFakeIp = 0;
let scanedIndex = 0;
let proxyIndex = 0;
let listProxy = [];
let listProxyOK = [];
const domain = [
    "@hotmail.fr",
    "@live.be",
    "@live.co.uk",
    "@live.it",
    "@hotmail.co.uk",
    "live.es"
]
let isRunning = false;
document.getElementById('close').addEventListener('click', () => {
    remote.app.quit();
})
document.getElementById('minimize').addEventListener('click', () => {
    remote.getCurrentWindow().minimize();
})
document.getElementById('selected-default').addEventListener('click', () => {
    changeStatusSpanText(0);
})
document.getElementById('selected-dcom').addEventListener('click', () => {
    changeStatusSpanText(1);
})
document.getElementById('selected-proxy').addEventListener('click', () => {
    changeStatusSpanText(2);
})
document.getElementById('menu-scan').addEventListener('click', ($event) => {
    selectMenu($event, 0)
})
document.getElementById('menu-result').addEventListener('click', ($event) => {
    selectMenu($event, 1)
})
start.addEventListener('click', () => {
    clickStartOrStop();
})

function onInit() {
    changeStatusButton();
    loadResult();
    loadProxy();
}
onInit();

function loadResult() {
    // if (fs.existsSync('failed.txt')) {
    //     const data = fs.readFileSync('failed.txt', 'UTF-8');
    //     const lines = data.split(/\r?\n/);
    //     failed = lines.length;
    //     if (lines.length > 150) {
    //         lines.splice(0, lines.length - 150);
    //     }
    //     lines.forEach((line) => {
    //         if (line != '') {
    //             addResult(line, false, false);
    //         }
    //     });

    // }
    if (fs.existsSync('success.txt')) {
        const data = fs.readFileSync('success.txt', 'UTF-8');
        const lines = data.split(/\r?\n/);
        success = lines.length;
        if (lines.length > 150) {
            lines.splice(0, lines.length - 150);
        }
        lines.forEach((line) => {
            if (line != '') {
                addResult(line, true, false);
            }
        });
    }
    total = success + failed;
}

function loadProxy() {
    if (fs.existsSync('proxy.txt')) {
        listProxy = [];
        const data = fs.readFileSync('proxy.txt', 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach((line) => {
            const temp = line.split(':');
            listProxy.push({ host: temp[0], port: temp[1] });
        });
        document.getElementById('selected-proxy').innerHTML = 'Proxy (' + listProxy.length + ')';
    }
}

function changeStatusButton() {
    start.classList = {};
    if (status) {
        start.classList.add('running');
        start.innerHTML = 'Stop';
    } else {
        start.classList.add('start');
        start.innerHTML = 'Start';
    }
}

function changeStatusSpanText(index) {
    if (index != 'undefined') indexFakeIp = index;
    if (indexFakeIp == 0) {
        spanText.innerHTML = 'Default';
    } else if (indexFakeIp == 1) {
        spanText.innerHTML = 'Dcom';
    }
    else if (indexFakeIp == 2) {
        spanText.innerHTML = 'Proxy (' + listProxy.length + ')';
    }
}
function addScaned(email, info, status) {
    isRunning = true;
    scanedIndex++;
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-10">1</li><li class="col-custom-50">luca</li><li class="col-custom-20 ">info</li><li class="col-custom-20 success">Success</li>';
    ul.children[0].innerHTML = scanedIndex;
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

function addResult(email, status, isWrite) {
    total++;
    countTotal.innerHTML = total;
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-20">1</li><li class="col-custom-50">luca</li><li class="col-custom-30 success">Success</li>';
    ul.children[1].innerHTML = email;
    ul.children[2].classList = {};
    if (status) {
        success++;
        countSuccess.innerHTML = success;
        ul.children[0].innerHTML = success;
        ul.children[2].innerHTML = 'Success';
        ul.children[2].classList = 'success';
        result_scaned[0].appendChild(ul);
        result_scaned[0].scrollTop = result_scaned[0].scrollHeight;
        if (result_scaned[0].childNodes.length > 150) {
            const max = result_scaned[0].childNodes.length;
            for (let i = max; i >= 150; i--) {
                result_scaned[0].removeChild(result_scaned[0].firstElementChild);
            }
        }
        if (isWrite) {
            try {
                if (!fs.existsSync('success.txt')) {
                    var createStream = fs.createWriteStream("success.txt");
                    createStream.end();
                }
                fs.appendFile('success.txt', email + '\n', function (err, result) {
                });
            } catch (err) {
                console.error(err)
            }
        }
    } else {
        failed++;
        countFailed.innerHTML = failed;
        ul.children[0].innerHTML = failed;
        ul.children[2].innerHTML = 'Failed';
        ul.children[2].classList = 'failed';
        result_scaned[1].appendChild(ul);
        result_scaned[1].scrollTop = result_scaned[1].scrollHeight;
        if (result_scaned[1].childNodes.length > 150) {
            const max = result_scaned[1].childNodes.length;
            for (let i = max; i >= 150; i--) {
                result_scaned[1].removeChild(result_scaned[1].firstElementChild);
            }
        }
        // if (isWrite) {
        //     try {
        //         if (!fs.existsSync('failed.txt')) {
        //             var createStream = fs.createWriteStream("failed.txt");
        //             createStream.end();
        //         }
        //         fs.appendFile('failed.txt', email + '\n', function (err, result) {
        //         });
        //     } catch (err) {
        //         console.error(err)
        //     }
        // }
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
        countTotal.innerHTML = total;
        countSuccess.innerHTML = success;
        countFailed.innerHTML = failed;
        menuScan.classList.remove('active');
        menuResult.classList.add('active');
        boxScan.classList.add('disable');
        boxResult.classList.remove('disable');
    }
}

async function randomUserName() {
    let options = {
        url: 'https://api.name-fake.com/english-united-states/',
        method: 'GET',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.72',
        }
    };
    let responseHTML = await request(options);
    let $ = cheerio.load(responseHTML);
    return $('div#copy3').text();
};
function getProxy() {
    if (proxyIndex > listProxy.length) {
        proxyIndex = 0;
    }
    const result = listProxy[proxyIndex];
    proxyIndex++;
    return result;
}


async function checkmail(email) {
    if (status) {
        let proxy = null;
        if (indexFakeIp == 2) {
            proxy = getProxy();
        }
        try {
            const result = await Worker.checkAccount(email, proxy);
            if (result.info.code !== 'RequestError') {
                addResult(email, result.info.success, true);
            }
            if (status)
                addScaned(email, result.info, result.info.success);

        }
        catch (e) {
        }
    }
}


async function check() {
    if (status) {
        try {
            const username = await randomUserName();
            for (const iterator of domain) {
                checkmail(username + iterator);
            }
        }
        catch (e) {
        }
        await check();
    }
}


async function run() {
    if (status) {
        if (indexFakeIp == 1) {
            for (let i = 0; i < 5; i++) {
                check();
            }
        } else if (indexFakeIp == 2) {
            for (let i = 0; i < 10; i++) {
                check();
            }
        } else {
            for (let i = 0; i < 5; i++) {
                check();
            }
        }
    }
}

function clickStartOrStop() {
    status = !status;
    changeStatusButton();
    run();
}


// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// setInterval(async () => {

//     if (isRunning && indexFakeIp != 1) {
//         isRunning = false;
//         await sleep(8000);
//         if (!isRunning) {
//             status = true;
//             scan_scaned.innerHTML = '';
//             run();
//             console.log('reRUn');
//         }
//     } else if (isRunning && indexFakeIp == 1) {
//         isRunning = false;
//         await sleep(8000);
//         if (!isRunning) {
//             await FakeIp.fakeIpViettel().then(async res => {
//                 if (res) {
//                     status = true;
//                     scan_scaned.innerHTML = '';
//                     run();
//                     console.log('reRUn');
//                 }
//             });
//         }
//     }
// }, 20000)

