const path = require('path')
const fs = require('fs')
const {spawn} = require('cross-spawn')

const spawnNodemon = (args) => {
    // todo: babel path is risky, need to be checked for existence/should use normal module resolution
    let path = ''
    try {
        path = require.resolve('../.bin/nodemon')
    } catch(e) {
        // console.log('not found: ../.bin/nodemon')
    }
    try {
        if(!path) {
            path = require.resolve('../../.bin/nodemon')
        }
    } catch(e) {
        // console.log('not found: ../../.bin/nodemon')
    }
    try {
        if(!path) {
            path = require.resolve('../../../.bin/nodemon')
        }
    } catch(e) {
        // console.log('not found: ../../../.bin/nodemon')
        throw new Error('lerna-packer serve backends: no .bin/nodemon found in any of the specified directories, maybe missing?')
    }
    return spawn(path, args)
}

function startNodemon(name, root, entry, build, experimental = {}) {
    return new Promise((resolve, reject) => {
        const buildDir = path.resolve(root, build)
        if(!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, {recursive: true})
        }
        const serverFile = path.resolve(root, build, entry)
        fs.writeFile(serverFile, '', {flag: 'wx'}, function(err) {
            if(err) {
                console.error(err)
            }
        })

        const args = []
        if(experimental.jsonModules) {
            args.push('--experimental-json-modules')
        }
        if(experimental.report) {
            args.push('--experimental-report')
        }
        if(experimental.reportUncaughtException) {
            args.push('--diagnostic-report-uncaught-exception')
        }
        if(experimental.reportOnSignal) {
            args.push('--diagnostic-report-on-signal' + (typeof experimental.reportOnSignal === 'string' ? experimental.reportOnSignal : ''))
        }
        if(experimental.reportOnFatalError) {
            args.push('--diagnostic-report-on-fatalerror')
        }
        if(experimental.reportDirectory) {
            args.push('--diagnostic-report-directory=' + experimental.reportDirectory)
        }
        if(experimental.reportFilename) {
            args.push('--diagnostic-report-filename=' + experimental.reportFilename)
        }
        if(experimental.policy) {
            args.push('--experimental-policy=' + experimental.policy)
        }
        args.push('-w', path.resolve(root, build), serverFile)
        let nodemon = spawnNodemon(args)
        nodemon.stdout.on('data', (data) => {
            process.stdout.write(`[${name}, nodemon] ${data}`)
        })

        nodemon.stderr.on('data', (data) => {
            process.stderr.write(`[${name}, nodemon] ERROR: ${data}`)
        })
        nodemon.on('exit', code => {
            if(code !== 0) {
                reject(`(${name}) nodemon failed: ${code}`)
            } else {
                resolve()
            }
        })
    })
}

exports.startNodemon = startNodemon
