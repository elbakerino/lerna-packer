const fs = require('fs');
const rimraf = require('rimraf');

const delDir = dir => (new Promise(((resolve) => {
    if(fs.existsSync(dir)) {
        console.log('deleting', dir);
        rimraf(dir, () => {
            console.log('deleted', dir);
            resolve();
        });
    } else {
        resolve();
    }
})));

exports.delDir = delDir;
