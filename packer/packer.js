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
        afterEsModules = undefined,
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
        })

        await Promise.all(promises)
            .then((e) => e.length === promises.length ?
                promises.length ? l('deleted all dists & build folders') : l('no dists exists.')
                : undefined)
    }

    if(doBuildWebpack || doServe) {
        await new Promise((resolve, reject) => {
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
            fs.writeFile(webpackPartialFile, webpackPartial, err => {
                if(err) {
                    l('Saving webpackPartial.config.json failed', err)
                    reject(err)
                    return
                }
                l('Updated webpackPartial.config.json')
                resolve()
            })
        })
    }

    if(doBuildBabel || doBuildWebpack) {
        // production build
        l('Start Production build')
    }

    const packagesNames = Object.keys(packages)
    if((doServe || doBuildBabel) && packagesNames.length > 0) {
        l('Start ESM ' + (doServe ? 'build & watch' : 'build') + ' for ' + packagesNames.length + ' modules: `' + packagesNames.join(', ') + '`')
        const esmPromise = buildEsModules(
            packages, pathBuild, babelTargets, doServe,
            (packages2, pathBuild2, doServe2) => {
                if(!afterEsModules) {
                    return Promise.resolve()
                }
                l('Start ESM build finalizing')
                return afterEsModules(packages2, pathBuild2, doServe2)
                    .then(() => {
                        l('Done ESM build finalize')
                    })
                    .catch(err => {
                        l('Done finalizing ESM build', err)
                        return Promise.reject('afterEsModules failed')
                    })
            },
        )
            .then(() => {
                l('Done ESM build')
            })
            .catch(err => {
                l('Error for ESM build', err)
                return Promise.reject('packages ESM build failure')
            })
        if(doBuildBabel) {
            await esmPromise
        } else if(doServe) {
            esmPromise.then(() => null)
        }
    }

    const appsConfigs = {}
    for(let app in apps) {
        appsConfigs[app] = buildAppPair(apps[app], packages, pathBuild)
    }

    if(doBuildWebpack && Object.keys(apps).length) {
        console.log('')
        l('Starting webpack build for apps `' + (Object.keys(appsConfigs).join(', ')) + '`')
        // get all `build` webpack configurations, for each app, executed by one `webpack`
        const configs = []
        for(let app in appsConfigs) {
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

            if(appsConfigs[app].appConfig.webpackBuilds) {
                configs.push(...appsConfigs[app].appConfig.webpackBuilds)
            }
        }

        if(configs.length > 0) {
            configs.forEach((c) => {
                // check created webpack configs, e.g.:
                // console.log(c.module.rules);
                // console.log(Object.keys(c.entry));
            })
            await buildWebpack(configs, apps, withProfile, root)
                .then((stats) => {
                    if(onAppBuild) {
                        l('webpack onAppBuild run')
                        return onAppBuild(appsConfigs, stats, configs)
                            .then(() => {
                                l('webpack onAppBuild done')
                            })
                    }
                })

            l('Done webpack build for apps `' + (Object.keys(apps).join(', ')) + '`')
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
                    backends[backend].babelArgs,
                ),
            )
            if(doServe && typeof backends[backend].entry === 'string') {
                backendPromises.push(
                    startNodemon(
                        backend,
                        backends[backend].root,
                        backends[backend].entry,
                        pathBuild,
                        backends[backend].nodeExperimental,
                        backends[backend].nodemonArgs,
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

    if(doServe && Object.keys(apps).length) {
        if(doServe === true) l('Starting all Apps:')
        else l('Starting App `' + doServe + '`:')

        const serveAppId = doServe !== true ? (Array.isArray(doServe) ? doServe : [doServe]) : false
        const servers = []
        for(let app in appsConfigs) {
            if(Array.isArray(serveAppId) && serveAppId.indexOf(app) === -1) {
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
            await Promise.all(servers).then((r) => l('Started serving ' + r.length + ' from ' + Object.keys(appsConfigs).length + ' apps.'))
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
