import { Configuration } from 'webpack'

export { webpack, Configuration } from 'webpack'

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
    root: string
    template: string
    contentBase: string
    publicPath?: string
    port: number
    main: string | string[]
    dist: string
    vendors?: string[]
    // passed to the webpack `CopyPlugin`
    copy?: { from: string, to: string }[]
    // extra plugins for webpack
    plugins?: Configuration['plugins'][]
    devServer?: AppsConfigDevServer
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
    targets: Partial<PackerTargets>,
    // absolute folder for e.g. profiling output
    root: string,
    // custom babel targets, `args` are passed to all pure-babel processes
    babelTargets?: { distSuffix: string, args: string[] }[]
): void

export function delDir(dir: string): Promise<any>
