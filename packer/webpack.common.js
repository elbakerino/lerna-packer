'use strict'

const path = require('path')
const isWsl = require('is-wsl')
const TerserPlugin = require('terser-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

function getConfig(
    isProd = false,
    {
        context = '',
        src,
        minimize = true,
        // babelPresets = [],
        // babelPlugins = [],
        include = [],
    } = {},
) {
    return {
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx'],
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    include: [
                        path.join(context, src),
                        ...include,
                    ],
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            /*presets: [
                                ...babelPresets,
                            ],
                            plugins: [
                                ...babelPlugins,
                            ],*/
                            // This is a feature of `babel-loader` for webpack (not Babel itself).
                            // It enables caching results in ./node_modules/.cache/babel-loader/
                            // directory for faster rebuilds.
                            cacheDirectory: true,
                            // See #6846 for context on why cacheCompression is disabled
                            cacheCompression: false,
                            compact: minimize,
                        },
                    }],
                }, /*{
                    // todo: fix deps presets, couldn't get it to work with lerna hoist
                    // Process any JS outside of the app with Babel.
                    // Unlike the application JS, we only compile the standard ES features.
                    test: /\.(js|mjs)$/,
                    exclude: [
                        /@babel(?:\/|\\{1,2})runtime/,
                        path.join(context, src'),
                        ...include,
                    ],
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        configFile: false,
                        compact: false,
                        presets: [
                            [
                                require.resolve('babel-preset-react-app/dependencies'),
                                {helpers: true},
                            ],
                        ],
                        cacheDirectory: true,
                        cacheCompression: false,

                        // If an error happens in a package, it's possible to be
                        // because it was compiled. Thus, we don't want the browser
                        // debugger to show the original code. Instead, the code
                        // being evaluated would be much more helpful.
                        sourceMaps: false,
                    },
                }, */{
                    test: /\.html$/i,
                    // todo `manifest.json` in `public/index.html` isn't loading with these loaders
                    exclude: [/public/],
                    use: [{
                        loader: 'ejs-loader',
                        options: {
                            esModule: false,
                        },
                    }, {
                        loader: 'extract-loader',
                    }, {
                        loader: 'html-loader',
                        options: {
                            minimize: minimize,
                        },
                    }],
                }, {
                    test: /\.css$/i,
                    exclude: [/node_modules/],
                    use: [
                        'style-loader',
                        'css-loader',
                    ],
                }, {
                    test: /\.css$/i,
                    include: [/node_modules/],
                    use: [
                        {loader: 'style-loader', options: {injectType: 'lazySingletonStyleTag'}},
                        'css-loader',
                    ],
                }, {
                    test: /\.s[ac]ss$/i,
                    exclude: [/node_modules/],
                    use: [
                        'style-loader',
                        'css-loader',
                        'sass-loader',
                    ],
                },
            ],
        },
        optimization: {
            minimize: minimize,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            ecma: 2016,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                            // Disabled because of an issue with Terser breaking valid code:
                            // https://github.com/facebook/create-react-app/issues/5250
                            // Pending further investigation:
                            // https://github.com/terser-js/terser/issues/120
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        // Added for profiling in devtools
                        keep_classnames: false,
                        keep_fnames: false,
                        /*keep_classnames: isEnvProductionProfile,
                        keep_fnames: isEnvProductionProfile,*/
                        output: {
                            ecma: 2016,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true,
                        },
                    },
                    // Use multi-process parallel running to improve the build speed
                    // Default number of concurrent runs: os.cpus().length - 1
                    // Disabled on WSL (Windows Subsystem for Linux) due to an issue with Terser
                    // https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
                    parallel: !isWsl,
                }),
            ],
        },
        plugins: [
            new ESLintPlugin({
                extensions: ['js', 'jsx', 'ts', 'tsx'],
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint'),
                context: context,
                files: [
                    path.join(context, src),
                    ...include,
                ],
                failOnError: isProd, // reload dev-server even if lint errors
                failOnWarning: isProd, // fail CI for lint warnings
            }),
        ],
    }
}

exports.getConfig = getConfig
