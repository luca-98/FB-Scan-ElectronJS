const jsdom = require("jsdom");
const fs = require('fs');
const UserAgent = require("./User-Agent");
const baseRequest = require('request-promise');
const cheerio = require('cheerio');
const { JSDOM } = jsdom;
let cookieObject = {};



function writeSource(pageSource, email) {
    if (!email) {
        fs.writeFile('index.html', pageSource, function (err, result) {
            if (err) console.log('error', err);
        });
    } else {
        fs.writeFile(process.cwd() + '\\temp\\' + email + '.html', pageSource, function (err, result) {
            if (err) console.log('error', err);
        });
    }
}

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

async function getLoginPage(request, userAgent) {
    try {
        let result = {};
        const option = {
            method: 'GET',
            url: 'https://m.facebook.com/login',
            timeout: 2000,
            headers: {
                'Host': 'm.facebook.com',
                'User-Agent': userAgent
            },
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
    catch (e) {
        return null;
    }
}

async function postLogin(request, resultGetLoginPage, userAgent, email) {
    let result = { success: false, code: '1:doesn\'t match' };
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
        .then(res => {
        })
        .catch(async function (error) {
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
                result = await getUrlResultLogin(request, resLocation, 'https://m.facebook.com/login', userAgent, newCookie, email);
            }
            else {
                result = { success: false, code: 'Other :' + code };
            }
        })
    return result;
}


async function getUrlResultLogin(request, url, refUrl, userAgent, cookie, email) {
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
            result = await getForgetPasswordLink(request, forgetPasswordLink, url, userAgent, newCookie, email);
        });
    return result;
}


async function getForgetPasswordLink(request, url, refUrl, userAgent, cookie, email) {
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
            result = await postSearch(request, actionPost, url, userAgent, newCookie, email, formData);
        });
    return result;
}

async function postSearch(request, url, refUrl, userAgent, cookie, email, formData) {
    let result = { success: false, code: '2:doesn\'t match' };
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
        .catch(async function (error) {
            const resLocation = error.response.headers.location;
            let newCookie = '';
            if (error.response.headers['set-cookie']) {
                newCookie = buildCookie(error.response.headers['set-cookie']);
            }
            result = await getSearchResult(request, resLocation, refUrl, userAgent, newCookie, email);
        })
    return result;
}


async function getSearchResult(request, url, refUrl, userAgent, cookie, email) {
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
        });
    return result;
}

const get_canary = async (request) => {
    let options = {
        url: 'https://account.live.com/password/reset',
        method: 'GET',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.72',
        },
        resolveWithFullResponse: true

    };
    let canary = '';
    let cookie = '';
    await request(options).then(res => {
        cookie = res.headers['set-cookie'].reduce(((previous, value) => previous + value.split(';')[0] + ';'), '');
        let $ = cheerio.load(res.body);
        canary = $('input#canary').val();
    })
    return { canary, cookie };
}

async function microsoft(request, email) {
    try {
        let resOfGetCanary = await get_canary(request);
        var headers = {
            'authority': 'account.live.com',
            'cache-control': 'max-age=0',
            'origin': 'https://account.live.com',
            'upgrade-insecure-requests': '1',
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.72',
            'sec-fetch-user': '?1',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'navigate',
            'referer': 'https://account.live.com/password/reset',
            'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',

        };
        if (resOfGetCanary && resOfGetCanary.cookie) {
            headers['cookie'] = resOfGetCanary.cookie
        }
        var dataString = 'iAction=SignInName&iRU=https%3A%2F%2Faccount.live.com%2FSummaryPage.aspx&amtcxt=QwZysLtejEQANjL5Ty9uwEwHQM0Tyw7JoMmDSNRFxmmV6C6pEJrN86%2F3W%2FX2UZq807OzAaDVACZ5Rbph8FEmBgDUHJrYlBAxDKTB6%2FRWjO7mqugKuMuJhmXsTGdFxek13FMPnuYcB0JOt15cmYH5YG4DxwqpdnEqUDL%2BKGN2K7EWB7fzLT8SEiIhpFmj4CjCYswDBuP86ug844Ta5R6mZNbALAREfGe2PRWyj3%2Fh4Jg%3D%3A2%3A3&uaid=1d26aae5e4604470810500bbf05b9b1b&network_type=&isSigninNamePhone=False&canary=' + resOfGetCanary.canary + '&PhoneCountry=VN&iSigninName=' + email;
        var options = {
            url: 'https://account.live.com/password/reset?uaid=1d26aae5e4604470810500bbf05b9b1b',
            method: 'POST',
            headers: headers,
            body: dataString
        };
        let responseHTML = await request(options);
        let $ = cheerio.load(responseHTML);
        let check = ($('input#iSigninName').val() || '').includes('@');

        return { success: check, code: 'microsoft ' + check };
    } catch (e) {
        return { success: false, code: e.name };
    }
};


const checkAccount = async (email, proxy) => {
    let request = baseRequest;
    if (proxy) {
        request = request.defaults({
            proxy: 'http://' + proxy.host + ':' + proxy.port
        })
    }
    const resultMicrosoft = await microsoft(request, email);
    if (resultMicrosoft.success) {
        const userAgent = UserAgent.getRandomUserAgentMobile();
        const resultGetLoginPage = await getLoginPage(request, userAgent);
        if (typeof resultGetLoginPage !== 'string') {
            const resulrPostLogin = await postLogin(request, resultGetLoginPage, userAgent, email);
            return { email, info: resulrPostLogin };
        } else {
            return { email, info: resultGetLoginPage }
        }
    } else {
        return { email, info: resultMicrosoft }
    }
}
exports.checkAccount = checkAccount;






// process.on('uncaughtException', function (err) {
//     console.log("worker err...");
// });


