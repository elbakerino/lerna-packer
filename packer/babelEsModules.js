const path = require('path')
const {createModulePackages} = require('./modulePackages')
const {spawnBabel} = require('./babelHelper')

function buildEsModule(name, pkg, pathBuild, target) {
    return new Promise((resolve, reject) => {
        const entry = pkg.entry
        const dist = path.resolve(pkg.root, pathBuild + target.distSuffix)

        let args = [entry, ...target.args, '--out-dir', dist]

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

function buildEsModules(packages, pathBuild, targets = [
    {distSuffix: '', args: ['--env-name', 'cjs', '--copy-files', '--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
    {distSuffix: '/esm', args: ['--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
]) {
    const babels = []
    Object.keys(packages).forEach(pack => {
        babels.push(
            ...targets.map(target => buildEsModule(pack, packages[pack], pathBuild, target)),
        )
    })

    return Promise.all(babels)
}

exports.buildEsModules = buildEsModules

function buildEsModulesPackagesJson(packages, pathBuild) {
    const packs = Object.keys(packages).map(pack =>
        createModulePackages(path.resolve(packages[pack].root, pathBuild)),
    )
    return Promise.all(packs)
}

exports.buildEsModulesPackagesJson = buildEsModulesPackagesJson
