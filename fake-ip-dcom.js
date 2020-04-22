const { exec } = require('child_process');



async function disconnect(callback) {
    console.log('disconnect...')
    await exec('rasdial /disconnect', (err, stdout, stderr) => {
        if (stdout) {
            console.log(stdout)
        }
        return callback(stdout);
    });
}
async function connect(callback) {
    console.log('reconnecting...')
    await exec('rasdial viettel', (err, stdout, stderr) => {
        if (stdout) {
            console.log(stdout)
        }
        return callback(stdout);
    });
}
async function fakeIpViettel() {
    return new Promise((resolve, reject) => {
        disconnect((stdout) => {
            connect((stdout) => {
                resolve(true);
            });
        })

    });
}

// fakeIpViettel().then(res=>{
//     console.log(res);
// })

exports.fakeIpViettel = fakeIpViettel;