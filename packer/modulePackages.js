const fs = require('fs')
const path = require('path')

const scanner = async function(
    dir,
    exclude = [],
    {onDir = () => Promise.resolve(undefined), onFile = () => Promise.resolve(undefined)},
    level = 0,
) {
    await new Promise((resolve, reject) => {
        fs.readdir(dir, (err, list) => {
            if(err) {
                reject(err)
                return
            }
            resolve(list)
        })
    })
        .then((fileList) => {
            const stats = []
            for(const file of fileList) {
                const filePath = path.resolve(dir, file)
                stats.push(new Promise((resolve, reject) => {
                    fs.stat(filePath, function(err, stat) {
                        if(err) {
                            reject(err)
                            return
                        }
                        resolve([stat, filePath])
                    })
                }))
            }
            return Promise.all(stats)
        })
        .then((stats) => {
            const info = {
                dirs: [],
                files: [],
            }
            stats.filter(s => Array.isArray(s)).forEach(([stat, filePath]) => {
                if(stat && stat.isDirectory()) {
                    if(exclude.includes(filePath)) {
                        return
                    }
                    info.dirs.push([filePath, level])
                    //onDir(filePath, level)
                    //scanner(filePath, exclude, {onDir, onFile}, level + 1)
                } else {
                    info.files.push([filePath, level])
                    //onFile(filePath)
                }
            })
            return info
        })
        .then(({dirs, files}) => {
            const nested = []
            for(const [filePath, level] of dirs) {
                nested.push(onDir(filePath, level))
                nested.push(scanner(filePath, exclude, {onDir, onFile}, level + 1))
            }
            for(const [filePath, level] of files) {
                nested.push(onFile(filePath, level))
            }
            return Promise.all(nested)
        })
        .then(() => undefined)
}

const fileExists = (path, onExists, onMissing) => {
    fs.stat(path, (err) => {
        if(err == null) {
            onExists()
        } else if(err.code === 'ENOENT') {
            onMissing()
        }
    })
}

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
 */
exports.createModulePackages = function createModulePackages(root) {
    return scanner(root, [path.resolve(root, 'esm')], {
        onDir: (dir, level) => {
            return new Promise(((resolve) => {
                fileExists(
                    path.join(dir, 'index.js'),
                    () => {
                        fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({
                            sideEffects: false,
                            module:
                                path.join(
                                    '../'.repeat(level + 1),
                                    'esm',
                                    dir.slice(root.length + 1).replace(/\\/g, '/').split(/\//g).join('/'),
                                    'index.js',
                                ).replace(/\\/g, '/'),
                            typings: './index.d.ts',
                        }, null, 4), () => {
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
