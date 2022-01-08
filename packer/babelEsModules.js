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

function buildEsModule(name, pkg, target, watch = false) {
    return new Promise((resolve, reject) => {
        const entry = pkg.entry
        const dist = path.resolve(pkg.root, 'build' + target.distSuffix)

        let args = [entry, ...target.args, '--out-dir', dist]

        if(watch) {
            args.push('-w')
        }

        if(-1 === process.argv.indexOf('--clean')) {
            let babel = spawnBabel(args)
            babel.stdout.on('data', (data) => {
                process.stdout.write(`[${name}, babel buildEsModules] ${data}`)
            })

            babel.stderr.on('data', (data) => {
                process.stderr.write(`[${name}, babel buildEsModules] ERROR: ${data}`)
            })
            babel.on('exit', code => {
                if(code !== 0) {
                    reject(`(${name}) babel buildEsModule transpilation failed: ${code}`)
                } else {
                    resolve()
                }
            })
        }
    })
}

function buildEsModules(
    packages,
    targets = [
        {distSuffix: '', args: ['--env-name', 'cjs', '--copy-files', '--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
        {distSuffix: '/esm', args: ['--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
    ],
    watch = false,
) {
    const babels = []
    Object.keys(packages).forEach(pack => {
        babels.push(
            ...targets.map(target => buildEsModule(pack, packages[pack], target), watch),
        )
    })

    return new Promise((resolve, reject) => {
        Promise.all(babels)
            .then((e) => {
                if(e.length === babels.length) {
                    console.log('Built ES modules!')
                    const packs = Object.keys(packages).map(pack =>
                        createModulePackages(path.resolve(packages[pack].root, 'build')),
                    )
                    Promise.all(packs).then((e) => {
                        if(e.length === packs.length) {
                            resolve()
                        }
                    })
                }
            })
            .catch((err) => {
                reject(err)
            })
    })
}

exports.buildEsModules = buildEsModules
