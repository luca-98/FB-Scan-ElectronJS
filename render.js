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
let indexMenu = 0;
let status = false;
let indexFakeIp = 0;

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
    if (fs.existsSync('failed.txt')) {
        const data = fs.readFileSync('failed.txt', 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach((line) => {
            if (line != '') {
                addResult(line, false, false);
            }
        });
    }
    if (fs.existsSync('success.txt')) {
        const data2 = fs.readFileSync('success.txt', 'UTF-8');
        const lines2 = data2.split(/\r?\n/);
        lines2.forEach((line) => {
            if (line != '') {
                addResult(line, true, false);
            }
        });
    }

}
onInit();

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
    } else {
        spanText.innerHTML = 'Dcom';
    }
}

function addScaned(index, email, status) {
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-10">1</li><li class="col-custom-70">luca</li><li class="col-custom-20 success">Success</li>';
    ul.children[0].innerHTML = index;
    ul.children[1].innerHTML = email;
    ul.children[2].classList = {};
    if (status) {
        ul.children[2].innerHTML = 'Success';
        ul.children[2].classList = 'success';
    } else {
        ul.children[2].innerHTML = 'Failed';
        ul.children[2].classList = 'failed';
    }
    scan_scaned.appendChild(ul);
}

function addScaned(index, email, status) {
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-10">1</li><li class="col-custom-70">luca</li><li class="col-custom-20 success">Success</li>';
    ul.children[0].innerHTML = index;
    ul.children[1].innerHTML = email;
    ul.children[2].classList = {};
    if (status) {
        ul.children[2].innerHTML = 'Success';
        ul.children[2].classList = 'success';
    } else {
        ul.children[2].innerHTML = 'Failed';
        ul.children[2].classList = 'failed';
    }
    scan_scaned.appendChild(ul);
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
        if (isWrite) {
            try {
                if (!fs.existsSync('success.txt')) {
                    var createStream = fs.createWriteStream("success.txt");
                    createStream.end();
                }
                fs.appendFile('success.txt', email + '\n', function (err, result) {
                    if (err) console.log('error', err);
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
        if (isWrite) {
            try {
                if (!fs.existsSync('failed.txt')) {
                    var createStream = fs.createWriteStream("failed.txt");
                    createStream.end();
                }
                fs.appendFile('failed.txt', email + '\n', function (err, result) {
                    if (err) console.log('error', err);
                });
            } catch (err) {
                console.error(err)
            }
        }
    }

}

function selectMenu(event, index) {
    const listMenu = document.querySelectorAll('.left-box div[onclick]');
    for (const iterator of listMenu) {
        iterator.classList.remove('active');
    }
    event.target.classList.add('active');
    console.log(boxResult)
    console.log(boxScan)

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
    indexMenu = index;
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

const domain = [
    "@hotmail.fr",
    "@live.be"
]
async function check() {
    let index = 1;
    for (let i = 0; i < 4; i++) {
        if (status) {
            const username = await randomUserName();
            for (const iterator of domain) {
                if (status) {
                    const result = await Worker.checkAccount(username + iterator);
                    addScaned(index, username + iterator, result.info.success);
                    addResult(username + iterator, result.info.success, true);
                    index++;
                }
            }
        }
    }
}


async function run() {
    if (status) {
        if (indexFakeIp == 1) {
            await FakeIp.fakeIpViettel().then(async res => {
                if (res) {
                    await check();
                }
            });
        } else {
            await check();
        }
    }

}

function clickStartOrStop() {
    status = !status;
    changeStatusButton();
    run();
}

setInterval(() => {
    run();
}, 10000);