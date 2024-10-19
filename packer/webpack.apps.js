'use strict'
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const CopyPlugin = require('copy-webpack-plugin')
const {merge} = require('webpack-merge')
const {getConfig} = require('./webpack.common')
const path = require('path')

const buildAppConfig = (
    main, entries, dist, root, template, {
        publicPath = undefined,
        cacheGroups = undefined,
        htmlWebpackPluginOptions = {},
        minify = false,
        noParse,
    },
) => ({
    entry: {
        main: main,
        ...(entries || {}),
    },
    output: {
        filename: 'assets/[name].[fullhash:8].js',
        path: dist,
        chunkFilename: 'assets/[name].chunk.[fullhash:8].js',
        publicPath: publicPath,
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
            exclude: [/\.(js|css|s[ac]ss|cjs|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
                name: 'assets/media/[name].[contenthash:8].[ext]',
            },
        }],
        noParse,
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            name: false,
            cacheGroups: cacheGroups || {
                default: false,
                vendors: {
                    chunks: 'all',
                    test: /[\\/]node_modules[\\/]/,
                    reuseExistingChunk: true,
                    priority: -15,
                },
            },
        },
    },
    plugins: [
        ...(template ? [
            new HtmlWebpackPlugin({
                inject: true,
                template: template,
                publicPath: publicPath,
                ...(minify ? {
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
                } : {}),
                ...htmlWebpackPluginOptions,
            }),
        ] : []),
    ],
})

const buildAppPair = (
    appConfig,
    packages,
    pathBuild,
) => {
    const {
        port,
        root,
        rootSrc = 'src',
        main, entries,
        contentBase, template,
        contentBaseCopyIgnore = [],
        dist,
        publicPath,
        devServer = {},
        devtoolServe,
        devtoolBuild,
        runtimeChunkServe,
        runtimeChunkBuild,
        copy = [],
        plugins = [],
        cacheGroups,
        htmlWebpackPluginOptions,
        noParse,
        webpackConfig,
    } = appConfig
    return {
        dist,
        appConfig,
        serve: () =>
            merge(
                getConfig(
                    false,
                    {
                        context: root,
                        src: rootSrc,
                        minimize: false,
                        include: [
                            ...Object.values(packages)
                                .filter(({doServeWatch}) => !doServeWatch)
                                .map(({root, rootSrc = 'src'}) => {
                                    return path.resolve(root, rootSrc)
                                }),
                        ],
                    },
                ),
                buildAppConfig(
                    main, entries, dist, root, template, {
                        publicPath: publicPath,
                        cacheGroups: cacheGroups,
                        htmlWebpackPluginOptions: htmlWebpackPluginOptions,
                        minify: false,
                        noParse,
                    },
                ),
                {
                    mode: 'development',
                    resolve: {
                        alias: Object.values(packages).reduce((aliases, {name, root, entry, doServeWatch}) => {
                            if(doServeWatch) {
                                aliases[name] = path.resolve(root + '/' + pathBuild)
                            } else {
                                aliases[name] = entry
                            }
                            return aliases
                        }, {}),
                    },
                    devServer: {
                        static: typeof devServer.static === 'object' ? {
                            ...devServer.static,
                            directory: contentBase,
                            publicPath: publicPath,
                        } : [
                            {
                                directory: contentBase,
                                publicPath: publicPath,
                            },
                            ...(devServer.static || []),
                        ],
                        client: {
                            logging: devServer.client && devServer.client.logging ? devServer.client.logging : 'info',
                            overlay: devServer.client && typeof devServer.client.overlay !== 'undefined' ? devServer.client.overlay : undefined,
                            progress: devServer.client && typeof devServer.client.progress !== 'undefined' ? devServer.client.progress : undefined,
                        },
                        host: devServer.host ? devServer.host : undefined,
                        headers: devServer.headers ? devServer.headers : undefined,
                        open: typeof devServer.open !== 'undefined' ? devServer.open : undefined,
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
                webpackConfig ? webpackConfig.global || {} : {},
                webpackConfig ? webpackConfig.serve || {} : {},
            ),
        build: () =>
            merge(
                getConfig(
                    true,
                    {
                        context: root,
                        src: rootSrc,
                        minimize: true,
                    },
                ),
                buildAppConfig(
                    main, entries, dist, root, template, {
                        publicPath: publicPath,
                        cacheGroups: cacheGroups,
                        htmlWebpackPluginOptions: htmlWebpackPluginOptions,
                        minify: true,
                        noParse,
                    },
                ),
                {
                    mode: 'production',
                    resolve: {
                        alias: Object.values(packages).reduce((aliases, {name, root}) => {
                            aliases[name] = path.resolve(root + '/' + pathBuild)
                            return aliases
                        }, {}),
                    },
                    optimization: {
                        runtimeChunk: typeof runtimeChunkBuild !== 'undefined' ? runtimeChunkBuild : 'single',
                        concatenateModules: true,
                        splitChunks: {usedExports: true},
                        providedExports: true,
                        usedExports: true,
                    },
                    devtool: devtoolBuild,
                    plugins: [
                        new CopyPlugin({
                            patterns: [
                                {
                                    from: contentBase,
                                    to: dist,
                                    globOptions: {
                                        ignore: template && template.indexOf(contentBase) === 0 ? [
                                            '**/' + template.slice(contentBase.length + 1).replace(/\\/g, '/'),
                                            ...contentBaseCopyIgnore,
                                        ] : contentBaseCopyIgnore,
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
                webpackConfig ? webpackConfig.global || {} : {},
                webpackConfig ? webpackConfig.build || {} : {},
            ),
    }
}

exports.buildAppPair = buildAppPair
