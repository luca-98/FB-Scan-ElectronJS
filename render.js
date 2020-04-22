// const { remote, ipcRender } = require('electron');
// "use strict";
// document.getElementById('close').addEventListener('click', () => {
//     remote.app.quit();
// })
// document.getElementById('minimize').addEventListener('click', () => {
//     remote.getCurrentWindow().miniFmize();
// })

const boxScan = document.getElementById('box-scan');
const boxResult = document.getElementById('box-result');
const start = document.getElementById('start');
const fakeIP = document.getElementById('fake-ip');
const spanText = fakeIP.querySelector('span');
const scan_scaned = document.querySelector('#box-scan .scaned-item');
const result_scaned = document.querySelectorAll('#box-result .scaned-item');
const countTotal = document.getElementById('count-total');
const countSuccess = document.getElementById('count-success');
const countFailed = document.getElementById('count-failed');
const listScan = [];

let total = 0;
let success = 0;
let failed = 0;
let indexMenu = 0;
let status = false;
let indexFakeIp = 0;

function onInit() {
    changeStatusButton();
    addResult(100, 'hihi', true);
    addScaned(100, 'hihi', true);
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

function addResult(index, email, status) {
    total++;
    countTotal.innerHTML = total;
    let ul = document.createElement('ul');
    ul.innerHTML = ' <li class="col-custom-20">1</li><li class="col-custom-50">luca</li><li class="col-custom-30 success">Success</li>';
    ul.children[0].innerHTML = index;
    ul.children[1].innerHTML = email;
    ul.children[2].classList = {};
    if (status) {
        success++;
        countSuccess.innerHTML = success;
        ul.children[2].innerHTML = 'Success';
        ul.children[2].classList = 'success';
        result_scaned[0].appendChild(ul);
    } else {
        failed++;
        countFailed.innerHTML = failed;
        ul.children[2].innerHTML = 'Failed';
        ul.children[2].classList = 'failed';
        result_scaned[1].appendChild(ul);
    }

}

function selectMenu(event, index) {
    const listMenu = document.querySelectorAll('.left-box div[onclick]');
    for (const iterator of listMenu) {
        iterator.classList.remove('active');
    }
    event.target.classList.add('active');
    if (index == 0) {
        boxResult.classList.add('disable');
        boxScan.classList.remove('disable');
    } else {
        countTotal.innerHTML = total;
        countSuccess.innerHTML = success;
        countFailed.innerHTML = failed;
        boxScan.classList.add('disable');
        boxResult.classList.remove('disable');
    }
    indexMenu = index;
}

function clickStartOrStop() {
    status = !status;
    changeStatusButton();
}