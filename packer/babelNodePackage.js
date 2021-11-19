const path = require('path')
const fs = require('fs')
const {spawn} = require('cross-spawn')
const {createModulePackages} = require('./modulePackages')

const spawnBabel = (args) => {
    // todo: babel path is risky, need to be checked for existence/should use normal module resolution
    let path = ''
    try {
        path = require.resolve('../.bin/babel')
    } catch(e) {
        // console.log('not found: ../.bin/babel')
    }
    try {
        if(!path) {
            path = require.resolve('../../.bin/babel')
        }
    } catch(e) {
        // console.log('not found: ../../.bin/babel')
    }
    try {
        if(!path) {
            path = require.resolve('../../../.bin/babel')
        }
    } catch(e) {
        // console.log('not found: ../../../.bin/babel')
    }
    return spawn(path, args)
}

function buildNodePackage(
    name,
    root,
    src,
    watch = false,
    babelArgs = ['--env-name', 'node', '--copy-files', '--extensions', '.ts', '--extensions', '.js', '--ignore', '**/*.d.ts'],
) {
    return new Promise((resolve, reject) => {
        const dist = path.resolve(root, 'build')

        let args = [root + '/' + src, ...babelArgs]
        if(watch) {
            args.push('-w')
        }
        args.push(...['--out-dir', dist])

        if(-1 === process.argv.indexOf('--clean')) {
            let babel = spawnBabel(args)
            babel.stdout.on('data', (data) => {
                process.stdout.write(`[${name}, babel buildNodePackage] ${data}`)
            })

            babel.stderr.on('data', (data) => {
                process.stderr.write(`[${name}, babel buildNodePackage] ERROR: ${data}`)
            })
            babel.on('exit', code => {
                if(code !== 0) {
                    reject(`(${name}) babel buildNodePackage transpilation failed: ${code}`)
                } else {
                    resolve()
                }
            })
        }
    })
}

exports.buildNodePackage = buildNodePackage
