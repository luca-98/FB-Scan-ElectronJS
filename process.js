// import * as Render from './render.js'
const request = require('request-promise');
const cheerio = require('cheerio');
const Worker = require("./worker");
const FakeIp = require("./fake-ip-dcom");
const Render = require("./render");
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('1aoPxJeI6K8wcFd8DploqoICNU3LIdtnTUiJ51xMZkMY');

let sheet;
let success = 0;
let failed = 0;
let proxyIndex = 0;
let listProxy = [];
let listProxyOK = [];
let countProcess = 0;

const domain = [
    "@hotmail.fr",
    "@live.be",
    "@live.co.uk",
    "@live.it",
    "@hotmail.co.uk",
    "live.es"
]


async function onInit() {
    loadResult();
    loadProxy();
    await doc.useServiceAccountAuth(require('./creds-from-google.json'));
    await doc.loadInfo(); // loads document properties and worksheets
    sheet = doc.sheetsByIndex[0];
}
onInit();

function loadResult() {
    if (fs.existsSync('success.txt')) {
        const data = fs.readFileSync('success.txt', 'UTF-8').trim();
        const lines = data.split('\n');
        if (lines.length > 150) {
            success = lines.length;
            lines.splice(0, lines.length - 150);
        }
        lines.forEach((line) => {
            Render.addResult(line, true);
        });
    }
    total = success + failed;
}

function loadProxy() {
    if (fs.existsSync('proxy.txt')) {
        listProxy = [];
        const data = fs.readFileSync('proxy.txt', 'UTF-8').trim();
        const lines = data.split('\n');
        lines.forEach((line) => {
            const temp = line.split(':');
            listProxy.push({ host: temp[0], port: temp[1] });
        });
        Render.setTotalProxy(listProxy.length);
    }
}

function getProxy() {
    if (proxyIndex > listProxy.length) {
        proxyIndex = 0;
    }
    const result = listProxy[proxyIndex];
    proxyIndex++;
    return result;
}

function addProxyOk(proxy) {
    if (!listProxyOK.includes(proxy)) {
        listProxyOK.push(proxy)
    }
}

async function addData(result) {
    countProcess--;
    if (Render.getStatusRunning() && countProcess < 200 ) {
        check();
    }
    Render.setCountProcess(countProcess);
    if (result.info.code && result.info.code !== 'RequestError') {
        Render.addResult(result.email, result.info.success);
        if (result.info.success) {
            await sheet.addRows(
                [{ name: result.info.nameUser ? result.info.nameUser : '', email: result.email, success: result.info.success, code: result.info.code }]
            );
        }
    }
    Render.addScaned(result.email, result.info, result.info.success);
}

async function checkmail(email) {
    if (Render.getStatusRunning()) {
        countProcess++;
        Render.setCountProcess(countProcess);
        let proxy = null;
        if (Render.getFakeIpType() == 2) {
            proxy = getProxy();
        }
        try {
            const result = await Worker.checkAccount(email, proxy);
            await addData(result);
        }
        catch (e) {
            countProcess--;
            Render.setCountProcess(countProcess);
        }
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

let isMax = false;

async function check() {
    if (Render.getStatusRunning()) {
        const username = await randomUserName();
        for (const iterator of domain) {
            checkmail(username + iterator);
        }
    }
}

async function run() {
    const thread = Render.getNumOfThread();
    for (let i = 0; i < thread; i++) {
        check();
    }
}

const start = document.getElementById('start');
start.addEventListener('click', () => {
    clickStartOrStop();
})
function clickStartOrStop() {
    Render.changeStatusButton();
    if (Render.getStatusRunning()) {
        run();
    }
}

process.on('uncaughtException', function (err) {
});
exports.run = run;
