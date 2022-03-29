const {spawn} = require('cross-spawn')

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

exports.spawnBabel = spawnBabel
