const path = require('path')
const {spawnBabel} = require('./babelHelper')
const fs = require('fs')

function buildEsModule(
    name, pkg,
    pathBuild, target,
    isServing = false,
    cb,
) {
    try {
        fs.statSync(path.resolve(pkg.root, pathBuild))
    } catch(e) {
        console.log(`[${name}, babel buildEsModules] creating package folder: ${path.resolve(pkg.root, pathBuild)}`)
        fs.mkdirSync(path.resolve(pkg.root, pathBuild))
    }
    return new Promise((resolve, reject) => {
        if(isServing && !pkg.doServeWatch) {
            // console.log(`[${name}, babel buildEsModules] skipped package, no babel doServeWatch`)
            resolve()
            return
        }
        const entry = pkg.entry
        const dist = path.resolve(pkg.root, pathBuild + target.distSuffix)

        let args = [entry, ...target.args, '--out-dir', dist]
        if(isServing) {
            args.push('-w')
        }

        let babel = spawnBabel(args)
        babel.stdout.on('data', (data) => {
            process.stdout.write(`[${name}, babel buildEsModules] ${data}`)
            if(isServing) {
                // executing `afterEsModules` only for the changed package
                cb({[name]: pkg}, pathBuild, isServing)
            }
        })

        babel.stderr.on('data', (data) => {
            process.stderr.write(`[${name}, babel buildEsModules] ERROR: ${data}`)
        })
        babel.on('exit', code => {
            if(isServing) {
                if(code !== 0) {
                    console.log(`(${name}) babel buildEsModule transpilation failure: ${code}`)
                    return
                }
                return
            }
            if(code !== 0) {
                reject(`(${name}) babel buildEsModule transpilation failed: ${code}`)
            } else {
                resolve()
            }
        })
    })
}

const babelTargetsArgsLegacy = {
    cjs: [
        '--env-name', 'cjs', '--no-comments', // '--copy-files', '--no-copy-ignored',
        '--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx',
        '--ignore', '**/*.d.ts',
        '--ignore', '**/*.test.tsx', '--ignore', '**/*.test.ts', '--ignore', '**/*.test.js',
    ],
    esm: [
        '--no-comments',
        '--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx',
        '--ignore', '**/*.d.ts',
        '--ignore', '**/*.test.tsx', '--ignore', '**/*.test.ts', '--ignore', '**/*.test.js',
    ],
}

const babelTargetsLegacyCjsFirst = exports.babelTargetsLegacyCjsFirst = [
    {
        distSuffix: '',
        args: babelTargetsArgsLegacy.cjs,
    },
    {
        distSuffix: '/esm',
        args: babelTargetsArgsLegacy.esm,
    },
]

const babelTargetsLegacyEsmFirst = exports.babelTargetsLegacyEsmFirst = [
    {
        distSuffix: '/cjs',
        args: babelTargetsArgsLegacy.cjs,
    },
    {
        distSuffix: '',
        args: babelTargetsArgsLegacy.esm,
    },
]

function buildEsModules(
    packages, pathBuild,
    targets = babelTargetsLegacyCjsFirst,
    isServing = false,
    cb = () => Promise.resolve(),
) {
    const babels = []
    Object.keys(packages).forEach(pack => {
        if(packages[pack].babelTargets) {
            if(packages[pack].babelTargets.length === 0) {
                throw new Error('`babelTargets` set on package must not be empty, is empty in `' + pack + '`')
            }
            babels.push(
                ...packages[pack].babelTargets.map(target => buildEsModule(pack, packages[pack], pathBuild, target, isServing, cb)),
            )
        } else {
            babels.push(
                ...targets.map(target => buildEsModule(pack, packages[pack], pathBuild, target, isServing, cb)),
            )
        }
    })

    return Promise.all(babels)
        .then(() => {
            if(isServing) return
            return cb(packages, pathBuild, isServing)
        })
}

exports.buildEsModules = buildEsModules
