const fs = require('fs')
const rimraf = require('rimraf')

const log = (prefix) => (message, ...err) => {
    const now = new Date()
    const ts = now.getHours().toFixed(0).padStart(2, '0') + ':' + now.getMinutes().toFixed(0).padStart(2, '0') + ':' + now.getSeconds().toFixed(0).padStart(2, '0')
    if(err.length > 0) {
        console.error('[' + prefix + '] ' + ts + ' ' + message)
    } else {
        console.log('[' + prefix + '] ' + ts + ' ' + message)
    }
}
exports.log = log

const delDir = dir => (new Promise(((resolve) => {
    const l = log('clean-dir')
    if(fs.existsSync(dir)) {
        l('start for ' + dir)
        rimraf(dir, (err) => {
            if(err) {
                l('rimraf error while deleting ' + dir, err)
                reject('delDir for ' + dir)
                return
            }
            l('done for ' + dir)
            resolve()
        })
    } else {
        resolve()
    }
})))

exports.delDir = delDir
