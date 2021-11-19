import { Configuration } from 'webpack'

export { webpack, Configuration } from 'webpack'

export interface AppsConfig {
    root: string
    template: string
    publicPath: string
    port: number
    main: string | string[]
    dist: string
    servedPath: string
    vendors: string[]
    plugins: Configuration['plugins'][]
}

export interface BackendConfig {
    root: string
    src: string
    entry: string
}

export interface PackageConfig {
    name: string
    root: string
    entry: string
    externals: {
        [key: string]: string
    }
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

export function buildEnv(servedPath: string): any

export function buildExternal(common: string): string

export function delDir(dir: string): Promise<any>
