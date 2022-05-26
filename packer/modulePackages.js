const fs = require('fs')
const path = require('path')
const {fileExists, fileScanner} = require('./tools')

/**
 * Puts a package.json into every child directory of root.
 * That package.json contains information about esm for bundlers so that imports
 * like import Typography from '@material-ui/core/Typography' are tree-shakeable.
 *
 * Modified from original: nested folder support
 *
 * @author Material-UI Authors, from: https://github.com/mui-org/material-ui/blob/master/scripts/copy-files.js
 * @licence MIT
 * @param {string} root
 * @param {(info: {level: number, root: string, dir: string}) => void} transformer
 * @param {string[]} exclude
 */
function createModulePackages(root, transformer, exclude = [path.resolve(root, 'esm')]) {
    return fileScanner(root, exclude, {
        onDir: (dir, level) => {
            return new Promise(((resolve) => {
                fileExists(
                    path.join(dir, 'index.js'),
                    () => {
                        fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(transformer({level, root, dir}), null, 4), () => {
                            resolve()
                        })
                    },
                    () => {
                        // todo: switch to errors on `.d.ts` enabled packages
                        console.warn('#! index.js missing in: ' + dir)
                        resolve()
                    },
                )
            }))
        },
    })
}

exports.createModulePackages = createModulePackages

/**
 * @param {{level: number, root: string, dir: string}} data
 * @return {any}
 */
exports.transformForEsModule = ({level, root, dir}) => {
    return {
        sideEffects: false,
        module:
            path.join(
                '../'.repeat(level + 1),
                'esm',
                dir.slice(root.length + 1).replace(/\\/g, '/').split(/\//g).join('/'),
                'index.js',
            ).replace(/\\/g, '/'),
        typings: './index.d.ts',
    }
}

/**
 *
 * @param {(info: {level: number, root: string, dir: string}) => any} transformer
 * @return {function(packages: {[id: string]: PackageConfig}, pathBuild: string): Promise<void>}
 */
const makeModulePackageJson = (transformer) => (packages, pathBuild) => {
    const packs = Object.keys(packages).map(pack =>
        createModulePackages(path.resolve(packages[pack].root, pathBuild), transformer),
    )
    return Promise.all(packs)
}

exports.makeModulePackageJson = makeModulePackageJson

/**
 *
 * @param {undefined | ((info: {packageJson: string, package: PackageConfig}) => any)} transformer
 * @return {function(packages: {[id: string]: PackageConfig}, pathBuild: string): Promise<void>}
 */
const copyRootPackageJson = (transformer = undefined) => (packages, pathBuild) => {
    const packs = Object.keys(packages).map(pack => {
        const buildPath = path.resolve(packages[pack].root, pathBuild)
        const packageJsonPath = path.resolve(packages[pack].root, 'package.json')
        const packageJsonBuild = path.resolve(buildPath, 'package.json')
        return new Promise((resolve, reject) => {
            fs.stat(packageJsonPath, (err) => {
                if(err) {
                    resolve()
                    return
                }
                fs.readFile(packageJsonPath, (err, file) => {
                    if(err) {
                        console.error('Error reading package.json', packageJsonPath, err)
                        reject()
                        return
                    }
                    const packageJson = JSON.parse(file.toString())
                    fs.writeFile(packageJsonBuild, JSON.stringify(transformer ? transformer({packageJson, package: pack}) : packageJson, null, 4), (err) => {
                        if(err) {
                            console.error('! Failed writing package.json', err)
                            reject()
                            return
                        }
                        console.log('Copied', packageJsonBuild)
                        resolve()
                    })
                })
            })
        })
    })
    return Promise.all(packs)
}

exports.copyRootPackageJson = copyRootPackageJson
