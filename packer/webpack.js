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

function serveWebpack(config) {
    const l = log('webpack dev-server')
    if(!config.devServer) {
        l('`appConfig.devServer` is not defined', config)
        return Promise.reject('webpack dev-server fail')
    }

    l('Starting server...')

    return new Promise((resolve, reject) => {
        const server = new WebpackDevServer(webpack(config), config.devServer)

        server.listen(config.devServer.port, 'localhost', function(err) {
            if(err) {
                l('Webpack Dev-Server listen error', err)
                reject(err)
            }
            l('WebpackDevServer listening at localhost:' + config.devServer.port)
            resolve()
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
