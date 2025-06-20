import { Configuration as WebpackConfiguration, MultiStats, StatsOptions as WebpackStatsOptions } from 'webpack'
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server'
import { Options as EslintOptions } from 'eslint-webpack-plugin'
import { Options } from 'html-webpack-plugin'

import webpack = require('webpack')

export { webpack }

export interface AppsConfig {
    port: number
    // the path to the e.g. main root folder for this app,
    // is used to create relative paths out of the other paths internally,
    // must be defined with `path.resolve`
    root: string
    // folder below `root`, that contains the code files, defaults to `src`, must be relative
    rootSrc?: string

    // the path to the e.g. `public` folder, must be below of `root`, must be defined with `path.resolve`
    contentBase: string
    // the path to the e.g. `index.html` in the `contentBase` folder, must be below of `contentBase`, must be defined with `path.resolve`
    template?: string
    // where the production build is saved to, can be anywhere, must be defined with `path.resolve`
    dist: string
    // the path of the final webpage, e.g. `/` when not deployed in a sub-folder
    publicPath?: string
    // passed to webpack `plugins.CopyPlugin.[].globOptions.ignore`,
    // only for building, to control what else from `contentBase` is ignored for copy,
    // e.g. because handled by webpack html plugin
    contentBaseCopyIgnore?: string[]

    // used for the main `chunk`
    main: string | string[]
    // additional entry chunks, `main` is also an `entry` default
    entries?: { [entry: string]: string | string[] }

    // passed to the webpack `CopyPlugin`
    copy?: { from: string, to: string }[]
    // extra plugins for webpack
    plugins?: WebpackConfiguration['plugins']
    // additional settings for the webpack `devServer` setting
    devServer?: WebpackDevServerConfiguration
    // overwrite (not merge!) the webpack `optimization.splitChunks.cacheGroups` setting
    cacheGroups?: { [k: string]: any }
    // additional options for the `html-webpack-plugin`, used to modify the injection rules for `template`
    htmlWebpackPluginOptions?: Partial<Options>

    // the webpack `devtools` config for either `serve` or/and `build`
    // https://webpack.js.org/configuration/devtool/#devtool
    devtoolServe?: string
    devtoolBuild?: string

    // the webpack optimization.runtimeChunk config for either `serve` or/and `build`
    // https://webpack.js.org/configuration/optimization/#optimizationruntimechunk
    runtimeChunkServe?: string | object | boolean
    runtimeChunkBuild?: string | object | boolean

    // additional webpack configs to execute in parallel
    webpackBuilds?: WebpackConfiguration[]

    // extra config, merged as last config into the respective part
    webpackConfig?: {
        // used for `build` or `serve`,
        // if defined additionally to e.g. `build`, then `global is merged first
        global?: Partial<Omit<WebpackConfiguration, 'stats'>>
        build?: Partial<Omit<WebpackConfiguration, 'stats'>>
        serve?: Partial<Omit<WebpackConfiguration, 'stats'>>
    }

    // webpack config for `module.noParse`
    noParse?: any[]

    // if the packages build folder should be aliased,
    // for development only works for packages with enabled `doServeWatch`
    aliasPackagesBuild?: 'always' | 'development' | 'production'

    // options passed to sass-loader [`sassOptions`](https://www.npmjs.com/package/sass-loader#sassoptions)
    sassOptions?: any

    // options passed to eslint-webpack-plugin
    eslintOptions?: EslintOptions
}

export interface BackendConfig {
    root: string
    src: string
    // entry to use as start point for `nodemon` - optional
    entry?: string
    // overwrite the babel args
    babelArgs?: string[]
    // additional args for nodemon
    nodemonArgs?: string[]
    nodeExperimental?: {
        // `--experimental-json-modules`
        jsonModules?: boolean
        // `--experimental-report`
        report?: boolean
        // `--diagnostic-report-uncaught-exception`
        reportUncaughtException?: boolean
        // `--diagnostic-report-on-signal`
        // `--diagnostic-report-on-signal=<string?`
        reportOnSignal?: boolean | string
        // `--diagnostic-report-on-fatalerror`
        reportOnFatalError?: boolean
        // `--diagnostic-report-directory=<string>`
        reportDirectory?: string
        // `--diagnostic-report-filename=<string>`
        reportFilename?: string
        // `--experimental-policy=<string>`
        policy?: string
    }
}

export interface PackageConfig {
    name: string
    root: string
    entry: string
    babelTargets?: {
        // min. empty string when directly in `dist` (`build` folder)
        distSuffix: string
        // babel args, except `entry` and `--out-dir` (supplied by script)
        args: string[]
    }[]
    // indicate that no extra `esm` folder exists, use to filter in packageJson adjustments
    esmOnly?: boolean
    // start the babel processes for this package in watch mode when serving apps/backends
    doServeWatch?: boolean
}

export interface PackerTargets {
    apps: { [key: string]: AppsConfig }
    backends: { [key: string]: BackendConfig }
    packages: { [key: string]: PackageConfig }
}

export function packer(
    // configuration of the to build or serve apps, packages and backends
    targets: Partial<PackerTargets>,
    // absolute folder for e.g. profiling output, must be over `AppsConfig.root`
    root: string,
    // further global packer overwrites/configuration
    options?: {
        webpackStatsConfig?: WebpackStatsOptions

        // folder name for `packages` and `backends` building folder, not used for `apps`
        pathBuild?: string,

        // executed  after all webpack builds and profiling have finished, not executed when serving
        // todo: correctly type `configs` with 'webpack options for build'
        onAppBuild?: (
            appsConfigs: { [key: string]: { appConfig: AppsConfig } },
            stats: MultiStats,
            configs: any[],
        ) => Promise<void>
        afterEsModules?: (
            packages: { [packageName: string]: PackageConfig },
            pathBuild: string,
            isServing?: boolean,
        ) => Promise<void>
    },
): Promise<[/* the execution commands */string[], /* elapsed time in ms */number]>

export function delDir(dir: string): Promise<any>
