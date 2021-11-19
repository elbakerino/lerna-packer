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
    }
    return spawn(path, args)
}

function startNodemon(name, root, entry) {
    return new Promise((resolve, reject) => {
        const buildDir = path.resolve(root, 'build')
        if(!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, {recursive: true})
        }
        const serverFile = path.resolve(root, 'build', entry)
        fs.writeFile(serverFile, '', {flag: 'wx'}, function(err) {
            if(err) {
                console.error(err)
            }
        })

        const args = ['--experimental-json-modules', '-w', path.resolve(root, 'build'), serverFile]
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
