const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const {log} = require('./tools')

function logStats(stats) {
    process.stdout.write(stats.toString({
        colors: true,
    }) + '\n')
}

function serveWebpack(appId, config) {
    const l = log('webpack dev-server')
    if(!config.devServer) {
        l('`appConfig.devServer` is not defined', {appId, config})
        return Promise.reject('webpack dev-server config missing')
    }

    l('Starting server for app `' + appId + '`...')

    return new Promise((resolve, reject) => {
        const server = new WebpackDevServer(config.devServer, webpack(config))

        server.start(config.devServer.port, 'localhost')
            .then(() => {
                // todo: detect https from env/config:
                l('listening at http://localhost:' + config.devServer.port + ' for app `' + appId + '`')
                resolve()
            })
            .catch((err) => {
                l('Webpack Dev-Server listen error for app `' + appId + '`', err)
                reject(err)
            })
    })
}

function buildWebpack(configs, appsConfigs, withProfile, root, onAppBuild) {
    return new Promise((resolve, reject) => {
        webpack(configs, (err, stats) => {
            if(err) {
                console.error(err.stack || err)
                if(err.details) {
                    console.error(err.details)
                }
                reject()
            }

            if(stats.hasErrors()) {
                logStats(stats)
                console.error('Compilation has errors!')
                reject()
            } else if(stats.hasWarnings()) {
                logStats(stats)
                console.error('Compilation has warnings!')
                reject()
            } else {
                logStats(stats)
                if(withProfile) {
                    fs.writeFile(path.join(root, '/profile.json'), JSON.stringify(stats.toJson(), null, 4), () => {
                        resolve(stats)
                    })
                } else {
                    if(onAppBuild) {
                        resolve(stats)
                    }
                }
            }
        })
    })
}

exports.buildWebpack = buildWebpack
exports.serveWebpack = serveWebpack
