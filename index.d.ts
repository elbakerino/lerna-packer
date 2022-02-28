import { Configuration } from 'webpack'
import { Options } from 'html-webpack-plugin'

export { webpack, MultiStats, Configuration } from 'webpack'

export interface AppsConfigDevServerStatic {
    directory: string
    publicPath?: string
    // https://webpack.js.org/configuration/dev-server/#serveindex
    serveIndex?: boolean | object
    // https://webpack.js.org/configuration/dev-server/#staticoptions
    staticOptions?: object
    // https://webpack.js.org/configuration/dev-server/#watch
    watch?: boolean | object
}

export interface AppsConfigDevServer {
    client?: {
        overlay?: boolean,
        progress?: boolean,
        logging?: 'log' | 'info' | 'warn' | 'error' | 'none' | 'verbose'
    }
    static?: Partial<AppsConfigDevServerStatic> | AppsConfigDevServerStatic[]
    https?: boolean | {
        key: string
        cert: string
        ca: string
        pfx?: string
        passphrase?: string
        requestCert?: string
    }
    historyApiFallback?: boolean | {
        rewrites?: {
            from: RegExp
            to: string
        }[]
        disableDotRule?: boolean
    }
    host?: 'local-ip' | 'local-ipv4' | 'local-ipv6' | string
    http2?: boolean
    magicHtml?: boolean
    headers?: {
        [h: string]: string
    } | {
        key: string
        value: string
    }[]
    open?: boolean
    hot?: boolean
    // https://webpack.js.org/configuration/dev-server/#devserverproxy
    proxy?: object
}

export interface AppsConfig {
    port: number
    // the path to the e.g. main root folder for this app,
    // is used to create relative paths out of the other paths internally,
    // must be defined with `path.resolve`
    root: string

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
    // added to the `vendor` chunk, included by default already `['react', 'react-dom']`
    vendors?: string[]
    // additional entry chunks, `main` is also an `entry` default
    entries?: { [entry: string]: string | string[] }

    // passed to the webpack `CopyPlugin`
    copy?: { from: string, to: string }[]
    // extra plugins for webpack
    plugins?: Configuration['plugins'][]
    // additional settings for the webpack `devServer` setting
    devServer?: AppsConfigDevServer
    // overwrite (not merge!) the webpack `optimization.splitChunks.cacheGroups` setting
    cacheGroups?: { [k: string]: any }
    // additional options for the `html-webpack-plugin`, used to modify the injection rules for `template`
    htmlWebpackPluginOptions: Partial<Options>

    // the webpack `devtools` config for either `serve` or/and `build`
    // https://webpack.js.org/configuration/devtool/#devtool
    devtoolServe?: string
    devtoolBuild?: string

    // the webpack optimization.runtimeChunk config for either `serve` or/and `build`
    // https://webpack.js.org/configuration/optimization/#optimizationruntimechunk
    runtimeChunkServe?: string | object | boolean
    runtimeChunkBuild?: string | object | boolean
}

export interface BackendConfig {
    root: string
    src: string
    entry: string
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
        // custom babel targets, `args` are passed to all pure-babel processes
        babelTargets?: { distSuffix: string, args: string[] }[]
        // the root folder of the packages, relative to the `root`
        pathPackages?: string,
        // folder name for `packages` and `backends` building folder, not used for `apps`
        pathBuild?: string,

        // executed  after all webpack builds and profiling have finished, not executed when serving
        // todo: correctly type `configs` with 'webpack options for build'
        onAppBuild?: (appsConfigs: { [key: string]: { appConfig: AppsConfig } }, stats: MultiStats, configs: any[]) => Promise<void>
    },
): Promise<[/* the execution commands */string[], /* elapsed time in ms */number]>

export function delDir(dir: string): Promise<any>
