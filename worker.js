const jsdom = require("jsdom");
const fs = require('fs');
const UserAgent = require("./User-Agent");
const { JSDOM } = jsdom;
const microsoft = require("./microsoft");
var request = require('request-promise');

function writeSource(pageSource, email) {
    if (!email) {
        fs.writeFile('result.html', pageSource, function (err, result) {
        });
    } else {
        fs.writeFile(process.cwd() + '\\temp\\' + email + '.html', pageSource, function (err, result) {
        });
    }
}

let cookieObject = {};
function buildCookie(cookie) {
    for (const iterator of cookie) {
        let temp = iterator.substring(0, iterator.indexOf(';'));
        temp = temp.split('=');
        cookieObject[temp[0]] = temp[1];
    }
    let result = '';
    for (const key in cookieObject) {
        if (cookieObject.hasOwnProperty(key)) {
            const element = cookieObject[key];
            result += key + '=' + element + ';'
        }
    }
    return result;
}



async function getLoginPage(userAgent) {
    let result = {};
    const option = {
        method: 'GET',
        url: 'https://m.facebook.com/login',
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent
        },
        timeout: 8000,
        resolveWithFullResponse: true
        // proxy
    }
    await request(option)
        .then((response) => {
            const document = new JSDOM(response.body).window.document;
            while (!document) {
                setTimeout(() => { }, 1000);
            }
            const actionForm = document.getElementById('login_form').action;
            const paramList = document.querySelectorAll('#login_form > input[type="hidden"]');
            if (paramList && paramList.length !== 0) {
                result['formData'] = {};
                for (const iterator of paramList) {
                    if (!iterator.id) {
                        result['formData'][iterator.name] = iterator.value;
                    }
                }
                let login = document.querySelector('#login_form button[type="submit"]');
                if (login) {
                    result['formData'][login.name] = login.value;
                }
            }
            result['url'] = 'https://m.facebook.com' + actionForm;
            if (response.headers['set-cookie']) {
                result['cookie'] = buildCookie(response.headers['set-cookie']);
            }
        }).catch(e => {
            result = e.name;
        });

    return result;
}

async function postLogin(resultGetLoginPage, userAgent, email) {
    let result = { success: false, code: '200 : postLogin' };
    const option = {
        method: 'POST',
        url: resultGetLoginPage.url,
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent,
            Referer: 'https://m.facebook.com/login'
        },
        resolveWithFullResponse: true,
        formData: resultGetLoginPage.formData
        // proxy
    };
    option.formData['email'] = email;
    option.formData['pass'] = email;
    if (resultGetLoginPage.cookie) {
        option.headers['Cookie'] = resultGetLoginPage.cookie;
    }
    await request(option)
        .catch(async function (error) {
            if (error.response) {
                const resLocation = error.response.headers.location;
                let start = resLocation.indexOf('&e=') + 3;
                let end = resLocation.indexOf('&', start);
                let code = resLocation.slice(start, end);
                if (code == '1348092') {
                    result = { success: true, code: '302 : Found' };
                } else if (code == '1348131') {
                    let newCookie = '';
                    if (error.response.headers['set-cookie']) {
                        newCookie = buildCookie(error.response.headers['set-cookie']);
                    }
                    result = await getUrlResultLogin(resLocation, 'https://m.facebook.com/login', userAgent, newCookie, email);
                }
                else {
                    result = { success: false, code: 'Other :' + code };
                }
            }

        })
    return result;
}

async function getUrlResultLogin(url, refUrl, userAgent, cookie, email) {
    let result = { success: false, code: '200: getUrlResultLogin' };
    const option = {
        method: 'GET',
        url: url,
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent,
            Referer: refUrl
        },
        resolveWithFullResponse: true,
    };
    if (cookie !== '') {
        option.headers['Cookie'] = cookie;
    }
    await request(option)
        .then(async response => {
            // writeSource(response.body, email);
            const forgetPasswordLink = 'https://m.facebook.com/login/identify';
            let newCookie = '';
            if (response.headers['set-cookie']) {
                newCookie = buildCookie(response.headers['set-cookie']);
            }
            result = await getForgetPasswordLink(forgetPasswordLink, url, userAgent, newCookie, email);
        })
    return result;
}

async function getForgetPasswordLink(url, refUrl, userAgent, cookie, email) {
    let result = { success: false, code: '200: getForgetPasswordLink' };
    const option = {
        method: 'GET',
        url: url,
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent,
            Referer: refUrl
        },
        resolveWithFullResponse: true,
    };
    if (cookie !== '') {
        option.headers['Cookie'] = cookie;
    }
    await request(option)
        .then(async response => {
            const document = new JSDOM(response.body).window.document;
            // writeSource(response.body, email);
            while (!document) {
                setTimeout(() => { }, 1000);
            }
            const actionPost = 'https://m.facebook.com' + document.getElementById('identify_yourself_flow').action;
            let newCookie = '';
            if (response.headers['set-cookie']) {
                newCookie = buildCookie(response.headers['set-cookie']);
            }
            const paramList = document.querySelectorAll('form > input[type="hidden"]');
            const formData = {}
            for (const iterator of paramList) {
                if (!iterator.id) {
                    formData[iterator.name] = iterator.value;
                }
            }
            let login = document.querySelector('form button[type="submit"]');
            if (login) {
                formData[login.name] = login.value;
            }
            result = await postSearch(actionPost, url, userAgent, newCookie, email, formData);
        })
    return result;
}

async function postSearch(url, refUrl, userAgent, cookie, email, formData) {
    let result = { success: false, code: '200 : postSearch' };
    const option = {
        method: 'POST',
        url: url,
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent,
            Referer: refUrl
        },
        resolveWithFullResponse: true,
        formData: formData
        // proxy
    };
    option.formData['email'] = email;
    if (cookie) {
        option.headers['Cookie'] = cookie;
    }
    await request(option)
        .then(response => {
        })
        .catch(async function (error) {
            if (error.response) {
                const resLocation = error.response.headers.location;
                let newCookie = '';
                if (error.response.headers['set-cookie']) {
                    newCookie = buildCookie(error.response.headers['set-cookie']);
                }
                result = await getSearchResult(resLocation, refUrl, userAgent, newCookie, email);
            }
        })
    return result;
}
async function getSearchResult(url, refUrl, userAgent, cookie, email) {
    let result = { success: false, code: '302 : getSearchResult' };
    const option = {
        method: 'GET',
        url: url,
        headers: {
            'Host': 'm.facebook.com',
            'User-Agent': userAgent,
            Referer: refUrl
        },
        resolveWithFullResponse: true,
    };
    if (cookie !== '') {
        option.headers['Cookie'] = cookie;
    }
    await request(option)
        .then(async response => {
            const document = new JSDOM(response.body).window.document;
            while (!document) {
                setTimeout(() => { }, 1000);
            }
            writeSource(response.body, email);
            let nameUser = email;
            if (document.querySelector('#contact_point_selector_form strong')) {
                nameUser = document.querySelector('#contact_point_selector_form strong').innerHTML;
            }
            result = { success: true, code: '302 : Found', nameUser };
        })
    return result;
}

const checkAccount = async (email, proxy) => {
    if (microsoft(email)) {
        if (proxy) {
            request = request.defaults({
                proxy: 'http://' + proxy.host + ':' + proxy.port
            })
        }
        const userAgent = UserAgent.getRandomUserAgentMobile();
        const resultGetLoginPage = await getLoginPage(userAgent);
        if (typeof resultGetLoginPage !== 'string') {
            const resulrPostLogin = await postLogin(resultGetLoginPage, userAgent, email);
            return { email, info: resulrPostLogin };
        } else {
            return { email, info: resultGetLoginPage }
        }
    }
}

exports.checkAccount = checkAccount;

