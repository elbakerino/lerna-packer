const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const {delDir} = require('./tools')
const {buildEsModules} = require('./babelEsModules')
const {buildNodePackage} = require('./babelNodePackage')
const {startNodemon} = require('./nodemon')
const {buildWebpack, serveWebpack} = require('./webpack')
const {buildAppPair} = require('./webpack.apps')

const packer = (
    {
        apps = {},
        packages = {},
        backends = {},
    },
    root,
    babelTargets = undefined,
) => {
    const doServe = argv['serve'] === true ? true : (argv['serve'] || false)
    const doClean = !!argv['clean']
    const doBuild = !!argv['build']
    const doBuildBabel = doBuild && !!argv['babel']
    const doBuildBackend = doBuild && !!argv['backend']
    const doBuildWebpack = doBuild && !!argv['webpack']
    const withProfile = !!argv['profile']

    const appsConfigs = {}
    for(let app in apps) {
        appsConfigs[app] = buildAppPair(apps[app], packages)
    }

    if(doBuildWebpack || doServe) {
        const webpackPartialRoot = path.join(root, '/packages')
        const webpackPartialFile = path.join(webpackPartialRoot, 'webpackPartialConfig.js')
        const webpackPartial = `
const path = require('path');

module.exports = {
    resolve: {
        alias: {
            ${Object.values(packages).reduce((aliases, {name, entry}) =>
            aliases + '\'' + [name] + '\': path.resolve(__dirname, \'.' + entry.replace(webpackPartialRoot, '').replace(/\\/g, '/') + '\'),\r\n'
            , '')}
        }
    }
}`
        fs.writeFile(webpackPartialFile, webpackPartial, err => {
            if(err) return console.error(err)
            console.log('Updated webpackPartial.config.json')
        })
    }

    if(doClean) {
        // clean dists

        // todo: a `lerna bootstrap --hoist` is needed afterwards, rimraf seems to break node_modules symlinking

        const promises = []

        for(let app in apps) {
            promises.push(delDir(apps[app].dist))
        }
        for(let backend in backends) {
            promises.push(delDir(backends[backend].root + '/build'))
        }

        // todo: lib/es should be like configured
        Object.values(packages).forEach(({name, noClean, root}) => {
            if(noClean) {
                console.log('Skip deleting build of ' + name)
                return
            }

            let pack_mod = path.resolve(root, 'build')
            promises.push(delDir(pack_mod))

            /*let pack_mod = path.resolve(pack, 'lib');
            promises.push(delDir(pack_mod));
            let pack_es = path.resolve(pack, 'es');
            promises.push(delDir(pack_es));*/

            Promise.all(promises)
                .then((e) => e.length === promises.length ?
                    promises.length ? console.log('deleted all dists!') : console.log('no dists exists.')
                    : undefined)
        })
    }

    if(doBuildBabel || doBuildWebpack) {
        // production build

        const packagesNames = Object.keys(packages)
        console.log('Production build')
        if(doBuildBabel) {
            console.log('Starting ES build for ' + packagesNames.length + ' modules: `' + packagesNames.join(', ') + '`')
            buildEsModules(packages, babelTargets)
                .then(() => null)
                .catch(err => {
                    console.error(err)
                    process.exit(1)
                })
        }

        if(doBuildWebpack) {
            console.log('')
            console.log('Starting webpack build for apps `' + (Object.keys(apps).join(', ')) + '`')
            // combine configs to build demo apps
            const configs = []
            for(let app in apps) {
                if(!appsConfigs[app].build) {
                    console.error('App has no serve config: ', app)
                    process.exit(1)
                }

                if(typeof appsConfigs[app].build === 'function') {
                    appsConfigs[app].build = appsConfigs[app].build()
                }

                if(typeof appsConfigs[app].build !== 'object') {
                    console.error('App has invalid serve config: ', app, appsConfigs[app].build)
                    process.exit(1)
                }

                configs.push(appsConfigs[app].build)
            }

            configs.forEach((c) => {
                // check created webpack configs, e.g.:
                // console.log(c.module.rules);
                // console.log(Object.keys(c.entry));
            })
            configs.profile = withProfile
            buildWebpack(configs, root)
        }
    }

    const backendsQty = Object.keys(backends).length
    if(backendsQty && (doBuildBackend || doServe)) {
        console.log('Backends...')

        if(doServe) {
            const packagesNames = Object.keys(packages)
            console.log('Starting ES build for ' + packagesNames.length + ' modules: `' + packagesNames.join(', ') + '`')
            buildEsModules(packages, babelTargets, true)
                .then(() => null)
                .catch(err => {
                    console.error(err)
                    process.exit(1)
                })
        }

        console.log(
            (doBuildBackend ? 'Building backends:' : 'Start serving backends:') + ' ' +
            Object.keys(backends).join(', '),
        )

        const backendPromises = []
        for(let backend in backends) {
            backendPromises.push(
                buildNodePackage(
                    backend,
                    backends[backend].root,
                    backends[backend].src,
                    doServe,
                ),
            )
            if(doServe) {
                backendPromises.push(
                    startNodemon(
                        backend,
                        backends[backend].root,
                        backends[backend].entry,
                        backends[backend].nodeExperimental,
                    ),
                )
            }
        }
        Promise.all(backendPromises)
            .then(() => {
                console.log('Finished `' + backendsQty + '` backends')
            })
            .catch((e) => {
                console.error('Failed at backends', e)
            })
    }

    if(doServe) {
        if(doServe === true) console.log('Starting all Apps:')
        else console.log('Starting App `' + doServe + '`:')

        let doServers = doServe !== true ? (Array.isArray(doServe) ? doServe : [doServe]) : false
        let servers = []
        for(let app in apps) {
            if(Array.isArray(doServers) && doServers.indexOf(app) === -1) {
                continue
            }
            if(appsConfigs[app].serve) {
                if(typeof appsConfigs[app].serve === 'function') {
                    appsConfigs[app].serve = appsConfigs[app].serve()
                }
                servers.push(serveWebpack(appsConfigs[app].serve))
            }
        }

        Promise.all(servers).then((r) => console.log('Started serving ' + r.length + ' from ' + Object.keys(apps).length + ' apps.'))
    }
}

exports.packer = packer
