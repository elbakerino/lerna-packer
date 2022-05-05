const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')

const log = (prefix) => (message, ...err) => {
    const now = new Date()
    const ts = now.getHours().toFixed(0).padStart(2, '0') + ':' + now.getMinutes().toFixed(0).padStart(2, '0') + ':' + now.getSeconds().toFixed(0).padStart(2, '0')
    if(err.length > 0) {
        console.error(ts + ' [' + prefix + '] ' + message, ...err)
    } else {
        console.log(ts + ' [' + prefix + '] ' + message)
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

const fileScanner = async function(
    dir,
    exclude = [],
    {onDir = () => Promise.resolve(undefined), onFile = () => Promise.resolve(undefined)},
    level = 0,
) {
    await new Promise((resolve, reject) => {
        fs.readdir(dir, (err, list) => {
            if(err) {
                reject(err)
                return
            }
            resolve(list)
        })
    })
        .then((fileList) => {
            const stats = []
            for(const file of fileList) {
                const filePath = path.resolve(dir, file)
                stats.push(new Promise((resolve, reject) => {
                    fs.stat(filePath, function(err, stat) {
                        if(err) {
                            reject(err)
                            return
                        }
                        resolve([stat, filePath])
                    })
                }))
            }
            return Promise.all(stats)
        })
        .then((stats) => {
            const info = {
                dirs: [],
                files: [],
            }
            stats.filter(s => Array.isArray(s)).forEach(([stat, filePath]) => {
                if(stat && stat.isDirectory()) {
                    if(exclude.includes(filePath)) {
                        return
                    }
                    info.dirs.push([filePath, level])
                    //onDir(filePath, level)
                    //fileScanner(filePath, exclude, {onDir, onFile}, level + 1)
                } else {
                    info.files.push([filePath, level])
                    //onFile(filePath)
                }
            })
            return info
        })
        .then(({dirs, files}) => {
            const nested = []
            for(const [filePath, level] of dirs) {
                nested.push(onDir(filePath, level))
                nested.push(fileScanner(filePath, exclude, {onDir, onFile}, level + 1))
            }
            for(const [filePath, level] of files) {
                nested.push(onFile(filePath, level))
            }
            return Promise.all(nested)
        })
        .then(() => undefined)
}

exports.fileScanner = fileScanner

const fileExists = (path, onExists, onMissing) => {
    fs.stat(path, (err) => {
        if(err == null) {
            onExists()
        } else if(err.code === 'ENOENT') {
            onMissing()
        }
    })
}
exports.fileExists = fileExists
