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

/**
 *
 * @param apps
 * @param packages
 * @param root absolute folder for e.g. profile
 */
export function packer(apps: { [key: string]: AppsConfig }, packages: { [key: string]: PackageConfig }, root: string): void

export function buildEnv(servedPath: string): any

export function buildExternal(common: string): string

export function delDir(dir: string): Promise<any>
