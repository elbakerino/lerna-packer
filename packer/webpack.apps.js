'use strict'
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const CopyPlugin = require('copy-webpack-plugin')
const {merge} = require('webpack-merge')
const {getConfig} = require('./webpack.common')
const path = require('path')

const buildAppConfig = (main, dist, root, template) => ({
    entry: {
        vendors: ['react', 'react-dom'],
        main: main,
    },
    output: {
        filename: 'assets/[name].[fullhash:8].js',
        path: dist,
        chunkFilename: 'assets/[name].chunk.[fullhash:8].js',
    },
    performance: {
        hints: false,
    },
    resolve: {
        // options for resolving module requests
        // (does not apply to resolving to loaders)
        // todo: make as strict as possible, only include needed ones
        modules: [
            path.resolve(root, 'node_modules'),
            'node_modules',
        ],
    },
    module: {
        rules: [{
            test: /\.(jpe?g|png|gif)$/i,
            exclude: /node_modules/,
            use: [
                'url-loader?limit=10000',
                'img-loader',
                'file-loader?name=[name].[ext]?[fullhash]',
            ],
        }, {
            // the following 3 rules handle font extraction
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: [
                'url-loader?limit=10000&mimetype=application/font-woff',
            ],
        }, {
            test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'file-loader',
        }, {
            test: /\.otf(\?.*)?$/,
            use: 'file-loader?name=/fonts/[name].[ext]&mimetype=application/font-otf',
        }, {
            loader: 'file-loader',
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise be processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(js|css|s[ac]ss|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
                name: 'assets/media/[name].[contenthash:8].[ext]',
            },
        }],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            name: false,
            cacheGroups: {
                default: false,
                vendors: false,
                vendor: {
                    chunks: 'all',
                    test: /node_modules/,
                },
            },
        },
    },
    plugins: [
        new HtmlWebpackPlugin(
            Object.assign(
                {},
                {
                    inject: true,
                    template: template,
                },
                process.env.NODE_ENV === 'production' ? {
                        minify: {
                            removeComments: true,
                            collapseWhitespace: true,
                            removeRedundantAttributes: true,
                            useShortDoctype: true,
                            removeEmptyAttributes: true,
                            removeStyleLinkTypeAttributes: true,
                            keepClosingSlash: true,
                            minifyJS: true,
                            minifyCSS: true,
                            minifyURLs: true,
                        },
                    }
                    : undefined,
            ),
        ),
    ],
})

/**
 * @param main
 * @param dist
 * @param root
 * @param template
 * @param contentBase
 * @param publicPath
 * @param devServer
 * @param devtoolServe
 * @param devtoolBuild
 * @param runtimeChunkServe
 * @param runtimeChunkBuild
 * @param port
 * @param vendors
 * @param copy
 * @param plugins
 * @param packages
 * @return {{build: (function(): {resolve: {extensions: string[]}, optimization: {minimize: boolean, minimizer: *[]}, module: {rules: [{include: *[], test: RegExp, loader: string, options: {formatter: string, cache: boolean, eslintPath: string, emitWarning: boolean}, enforce: string}, {include: *[], test: RegExp, use: [{loader: string, options: {cacheCompression: boolean, compact: boolean, cacheDirectory: boolean}}]}, {test: RegExp, loader: string, options: {cacheCompression: boolean, presets: [string, {helpers: boolean}][], compact: boolean, babelrc: boolean, configFile: boolean, cacheDirectory: boolean, sourceMaps: boolean}, exclude: *[]}, {test: RegExp, use: [{loader: string, options: {esModule: boolean}}, {loader: string}, {loader: string, options: {minimize: boolean}}]}, {test: RegExp, use: string[], exclude: RegExp[]}, null, null]}}), dist, serve: (function(): {resolve: {extensions: string[]}, optimization: {minimize: boolean, minimizer: *[]}, module: {rules: [{include: *[], test: RegExp, loader: string, options: {formatter: string, cache: boolean, eslintPath: string, emitWarning: boolean}, enforce: string}, {include: *[], test: RegExp, use: [{loader: string, options: {cacheCompression: boolean, compact: boolean, cacheDirectory: boolean}}]}, {test: RegExp, loader: string, options: {cacheCompression: boolean, presets: [string, {helpers: boolean}][], compact: boolean, babelrc: boolean, configFile: boolean, cacheDirectory: boolean, sourceMaps: boolean}, exclude: *[]}, {test: RegExp, use: [{loader: string, options: {esModule: boolean}}, {loader: string}, {loader: string, options: {minimize: boolean}}]}, {test: RegExp, use: string[], exclude: RegExp[]}, null, null]}})}}
 */
const buildAppPair = (
    {
        main, dist, root, template,
        contentBase,
        publicPath,
        port,
        devServer = {},
        devtoolServe,
        devtoolBuild,
        runtimeChunkServe,
        runtimeChunkBuild,
        vendors = [],
        copy = [],
        plugins = [],
    },
    packages,
) => ({
    dist,
    serve: () => getConfig(
        merge(
            buildAppConfig(main, dist, root, template),
            {
                mode: 'development',
                entry: {
                    vendors,
                },
                resolve: {
                    alias: Object.values(packages).reduce((aliases, {name, entry}) => {
                        aliases[name] = entry
                        return aliases
                    }, {}),
                },
                devServer: {
                    static: typeof devServer.static === 'object' ? {
                        ...devServer.static,
                        directory: contentBase,
                        publicPath: publicPath || '/',
                    } : [
                        {
                            directory: contentBase,
                            publicPath: publicPath || '/',
                        },
                        ...(devServer.static || []),
                    ],
                    client: {
                        logging: devServer.client && devServer.client.logging ? devServer.client.logging : 'info',
                        overlay: devServer.client && devServer.client.overlay ? devServer.client.overlay : undefined,
                        progress: devServer.client && devServer.client.progress ? devServer.client.progress : undefined,
                    },
                    host: devServer.host ? devServer.host : undefined,
                    headers: devServer.headers ? devServer.headers : undefined,
                    open: devServer.open ? devServer.open : undefined,
                    proxy: devServer.proxy ? devServer.proxy : undefined,
                    compress: true,
                    hot: typeof devServer.hot !== 'undefined' ? devServer.hot : true,
                    http2: typeof devServer.http2 !== 'undefined' ? devServer.http2 : undefined,
                    https: typeof devServer.https !== 'undefined' ? devServer.https : undefined,
                    magicHtml: typeof devServer.magicHtml !== 'undefined' ? devServer.magicHtml : undefined,
                    historyApiFallback: typeof devServer.historyApiFallback !== 'undefined' ? devServer.historyApiFallback : true,
                    port: port,
                },
                optimization: {
                    runtimeChunk: typeof runtimeChunkServe !== 'undefined' ? runtimeChunkServe : 'single',
                },
                plugins: [
                    ...(copy.length ? [new CopyPlugin({patterns: copy})] : []),
                    ...plugins,
                ],
                //devtool: 'eval-cheap-module-source-map',// faster rebuild, not for production
                devtool: devtoolServe || 'cheap-module-source-map',// slow build, for production
            },
        ),
        {
            context: root,
            minimize: false,
            include: [
                Object.values(packages).map(({root}) =>
                    path.resolve(root, 'src'),
                ),
            ],
        },
    ),
    build: () => getConfig(
        merge(
            buildAppConfig(main, dist, root, template),
            {
                mode: 'production',
                entry: {
                    vendors,
                },
                resolve: {
                    alias: Object.values(packages).reduce((aliases, {name, root}) => {
                        aliases[name] = root + '/build'
                        return aliases
                    }, {}),
                },
                optimization: {
                    runtimeChunk: typeof runtimeChunkBuild !== 'undefined' ? runtimeChunkBuild : 'single',
                },
                devtool: devtoolBuild,
                plugins: [
                    new CopyPlugin({
                        patterns: [
                            {
                                from: contentBase,
                                to: dist,
                                globOptions: {
                                    ignore: [
                                        ...(template.indexOf(contentBase) === 0 ? ['**/' + template.substr(contentBase.length + 1).replace(/\\/g, '/')] : []),
                                    ],
                                },
                            },
                            ...copy,
                        ],
                    }),
                    ...plugins,
                    // Inlines the webpack runtime script. This script is too small to warrant
                    // a network request.
                    // https://github.com/facebook/create-react-app/issues/5358
                    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
                ],
            },
        ),
        {
            context: root,
            minimize: true,
        },
    ),
})

exports.buildAppPair = buildAppPair
