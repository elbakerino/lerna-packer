const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const {delDir, log} = require('./tools')
const {buildEsModules} = require('./babelEsModules')
const {buildNodePackage} = require('./babelNodePackage')
const {startNodemon} = require('./nodemon')
const {buildWebpack, serveWebpack} = require('./webpack')
const {buildAppPair} = require('./webpack.apps')

const packer = async (
    {
        apps = {},
        packages = {},
        backends = {},
    },
    root,
    {
        babelTargets = undefined,
        pathPackages = 'packages',
        pathBuild = 'build',
        onAppBuild = undefined,
    } = {},
) => {
    const startTime = process.hrtime()
    const l = log('packer')
    const doServe = argv['serve'] === true ? true : (argv['serve'] || false)
    const doClean = !!argv['clean']
    const doBuild = !!argv['build']
    const doBuildBabel = doBuild && !!argv['babel']
    const doBuildBackend = doBuild && !!argv['backend']
    const doBuildWebpack = doBuild && !!argv['webpack']
    const withProfile = !!argv['profile']

    const appsConfigs = {}
    for(let app in apps) {
        appsConfigs[app] = buildAppPair(apps[app], packages, pathBuild)
    }

    if(doBuildWebpack || doServe) {
        const webpackPartialRoot = path.join(root, pathPackages)
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
        // todo: make await?
        fs.writeFile(webpackPartialFile, webpackPartial, err => {
            if(err) return l('webpackPartial save failed', err)
            l('Updated webpackPartial.config.json')
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
            promises.push(delDir(path.join(backends[backend].root, pathBuild)))
        }

        // todo: lib/es should be like configured
        Object.values(packages).forEach(({name, noClean, root}) => {
            if(noClean) {
                l('Skip deleting build of ' + name)
                return
            }

            let pack_mod = path.resolve(root, pathBuild)
            promises.push(delDir(pack_mod))

            /*let pack_mod = path.resolve(pack, 'lib');
            promises.push(delDir(pack_mod));
            let pack_es = path.resolve(pack, 'es');
            promises.push(delDir(pack_es));*/
        })

        await Promise.all(promises)
            .then((e) => e.length === promises.length ?
                promises.length ? l('deleted all dists & build folders') : l('no dists exists.')
                : undefined)
    }

    if(doBuildBabel || doBuildWebpack) {
        // production build
        l('Start Production build')

        const packagesNames = Object.keys(packages)
        if(doBuildBabel && packagesNames.length > 0) {
            l('Start ESM build for ' + packagesNames.length + ' modules: `' + packagesNames.join(', ') + '`')
            await buildEsModules(packages, pathBuild, babelTargets)
                .then(() => {
                    l('Done ESM build')
                })
                .catch(err => {
                    l('Error for ESM build', err)
                    return Promise.reject('packages ESM build failure')
                })
        }

        if(doBuildWebpack) {
            console.log('')
            l('Starting webpack build for apps `' + (Object.keys(apps).join(', ')) + '`')
            // combine configs to build demo apps
            const configs = []
            for(let app in apps) {
                if(!appsConfigs[app].build) {
                    l('App has no serve config: ', app)
                    return Promise.reject()
                }

                if(typeof appsConfigs[app].build === 'function') {
                    appsConfigs[app].build = appsConfigs[app].build()
                }

                if(typeof appsConfigs[app].build !== 'object') {
                    l('App has invalid serve config: ', app, appsConfigs[app].build)
                    return Promise.reject()
                }

                configs.push(appsConfigs[app].build)
            }

            if(configs.length > 0) {
                configs.forEach((c) => {
                    // check created webpack configs, e.g.:
                    // console.log(c.module.rules);
                    // console.log(Object.keys(c.entry));
                })
                await buildWebpack(configs, apps, withProfile, root, onAppBuild)
                    .then((stats) => {
                        if(onAppBuild) {
                            l('webpack onAppBuild run')
                            return onAppBuild(appsConfigs, stats, configs)
                        }
                    })
                    .then(() => {
                        if(onAppBuild) {
                            l('webpack onAppBuild done')
                        }
                        return null
                    })

                l('Done webpack build for apps `' + (Object.keys(apps).join(', ')) + '`')
            }
        }
    }

    const backendsQty = Object.keys(backends).length
    if(backendsQty && (doBuildBackend || doServe)) {
        l(
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
                    pathBuild,
                    doServe,
                ),
            )
            if(doServe) {
                backendPromises.push(
                    startNodemon(
                        backend,
                        backends[backend].root,
                        backends[backend].entry,
                        pathBuild,
                        backends[backend].nodeExperimental,
                    ),
                )
            }
        }
        const backendResolver = Promise.all(backendPromises)
            .then(() => {
                l('Finished `' + backendsQty + '` backends')
            })
            .catch((e) => {
                l('Failed at backends', e)
            })
        if(doBuild) {
            await backendResolver.then(() => null)
        } else if(doServe) {
            backendResolver.then(() => null)
        }
    }

    if(doServe) {
        if(doServe === true) l('Starting all Apps:')
        else l('Starting App `' + doServe + '`:')

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
                servers.push(serveWebpack(app, appsConfigs[app].serve))
            }
        }

        if(servers.length > 0) {
            await Promise.all(servers).then((r) => l('Started serving ' + r.length + ' from ' + Object.keys(apps).length + ' apps.'))
        } else {
            l('No apps starting, no defined or activated..')
        }
    }
    const execs = {
        doServe,
        doClean,
        doBuild,
        doBuildBabel,
        doBuildBackend,
        doBuildWebpack,
        withProfile,
    }


    const elapsedTime = process.hrtime(startTime)[1] / 1000000 // in ms
    return Promise.resolve([
        Object.keys(execs).reduce((exs, ec) => [...exs, ...(execs[ec] ? [ec] : [])], []),
        Number(elapsedTime.toFixed(4)),
    ])
}

exports.packer = packer
