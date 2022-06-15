const path = require('path')
const {spawnBabel} = require('./babelHelper')

function buildNodePackage(
    name,
    root,
    src,
    pathBuild,
    watch = false,
    babelArgs = ['--env-name', 'node', '--extensions', '.ts', '--extensions', '.js', '--ignore', '**/*.d.ts'],
) {
    return new Promise((resolve, reject) => {
        const dist = path.resolve(root, pathBuild)

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
