export interface AppsConfig {
    root: string
    template: string
    publicPath: string
    port: number
    main: string,
    dist: string,
    servedPath: string
    vendors: string[]
}

export interface PackageConfig {
    name: string
    root: string
    entry: string
    externals: {
        [key: string]: string
    }
}

export function packer(
    apps: { [key: string]: AppsConfig },
    packages: { [key: string]: PackageConfig },
    // absolute folder for e.g. profiling output
    root: string,
    // custom babel targets, `args` are passed to all pure-babel processes
    babelTargets?: { distSuffix: string, args: string[] }[]
): void

export function buildEnv(servedPath: string): any

export function buildExternal(common: string): string

export function delDir(dir: string): Promise<any>
