# Lerna Packer

[![MIT license](https://img.shields.io/npm/l/@ui-schema/ui-schema?style=flat-square)](https://github.com/ui-schema/ui-schema/blob/master/LICENSE)
[![npm (scoped)](https://img.shields.io/npm/v/lerna-packer?style=flat-square)](https://www.npmjs.com/package/lerna-packer)

React multi-app and package build handling for [lerna](https://github.com/lerna/lerna) monorepos.

**App**: webpack serving and building, scss/css support, public folder etc. - similar to create-react-app.

**Backends**: NodeJS backend server, watching and production build with babel, dev serving with nodemon.

**Packages**: publishable packages, can be used by apps/backends directly, production built with babel.

**Supports**: ESNext, React, TypeScript, d.ts Generation, Sass, Code Split compatible, es-modules and commonjs, Jest and Testing Library, ...

    npm init
    npm i --save lerna lerna-packer

> **experimental**, fix the version without any modifier

Add `packerConfig.js` with configs for apps and packages (component libraries).

> [check typescript definition](https://github.com/elbakerino/lerna-packer/blob/master/index.d.ts) for full configuration options

```js
const path = require('path');
const {packer} = require('lerna-packer');

packer(
    // apps and packages are required, backends are optional
    {
        apps: {
            docs: {
                port: 9219,// only for serving / webpack dev-server
                root: path.resolve(__dirname, 'packages', '_docs-control'),
                template: path.resolve(__dirname, 'packages', '_docs-control/public/index.html'),
                contentBase: path.resolve(__dirname, 'packages', '_docs-control/public'),// also the root for the dev-server
                main: path.resolve(__dirname, 'packages', '_docs-control/src/index.tsx'),
                //entries: {},// further webpack entries for this app
                dist: path.resolve(__dirname, 'dist', 'docs-control'),
                publicPath: '/',
                vendors: [],
                plugins: [],
            },
        },
        backends: {
            someApi: {
                root: path.resolve(__dirname, 'packages', 'some-api'),
                src: 'src',
                entry: 'server.js',
            },
        },
        packages: {
            // the keys are the commonjs names that is applied to externals
            // this is the same as `@babel/plugin-transform-modules-commonjs` applies
            controlKit: {
                name: '@control-ui/kit',
                root: path.resolve(__dirname, 'packages', 'control-kit'),
                entry: path.resolve(__dirname, 'packages', 'control-kit/src/'),
            },
            controlApp: {
                name: '@control-ui/app',
                root: path.resolve(__dirname, 'packages', 'control-app'),
                entry: path.resolve(__dirname, 'packages', 'control-app/src/'),
            },
        }
    },
    __dirname,
    // optional, additional global packer config:
    {
        pathPackagesBuild: 'build',
        pathPackages: 'packages',
        onAppBuild: (appsConfigs, stats, configs) => {
            return Promise.resolve(undefined)
        },
    }
)
    .then(([execs, elapsed]) => {
        if(execs.indexOf('doServe') !== -1) {
            console.log('[packer] is now serving (after ' + elapsed + 'ms)')
            // do not exit when serving!
        } else {
            console.log('[packer] finished successfully (after ' + elapsed + 'ms)', execs)
            process.exit(0)
        }
    })
    .catch((e) => {
        console.error('[packer] finished with error(s)', e)
        process.exit(1)
    })
```

Add scripts to `package.json` to handle serving, building for developer and CI.

- see command with `node packerConfig.js` for the `lerna-packer` CLI commands
- see command with `lerna` for the `lerna` CLI commands
- use:
    - `npm start` for local dev build & serve
    - `npm run build` for production ready build
    - `npm run tdd` for test-driven development (jest)
    - `npm i && npm run bootstrap && npm run link` for initial setup / after `package.json` changes
    - `npm run clean && rm -rf node_modules` for cleanup of `dist`/build folders and `node_modules` folders
    - `npm run clean-dist` for cleanup of only `dist`/build folders
    - `npm run release` for npm / registry publishing of the `packages` (not apps/backends)

```json
{
    "scripts": {
        "start": "npm run clean-dist && npm run serve",
        "serve": "cross-env NODE_ENV=development node packerConfig.js --serve",
        "prebuild": "npm run clean-dist",
        "build": "npm run build-all && npm run dtsgen",
        "build-all": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --babel --backend --webpack",
        "build-babel": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --babel",
        "build-backend": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --backend",
        "build-webpack": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --webpack",
        "clean": "npm run clean-dist && lerna clean -y",
        "clean-dist": "node packerConfig.js --clean",
        "link": "lerna link --force-local",
        "dtsgen": "lerna run dtsgen",
        "bootstrap": "lerna bootstrap",
        "hoist": "lerna bootstrap --hoist",
        "test": "jest -c=\"packages/jest.config.js\"",
        "tdd": "npm test -- --watch --watchman --coverage=false",
        "release": "lerna publish from-package --contents build --no-git-reset"
    }
}
```

Add `babel.config.json` or similar:

```json
{
    "presets": [
        [
            "@babel/preset-react",
            {
                "loose": false
            }
        ],
        "@babel/preset-typescript"
    ],
    "plugins": [
        "@babel/plugin-syntax-dynamic-import",
        "@babel/plugin-transform-react-jsx",
        "@babel/plugin-transform-template-literals",
        "@babel/plugin-proposal-optional-chaining",
        "@babel/plugin-proposal-export-namespace-from",
        "@babel/plugin-proposal-export-default-from",
        "@babel/plugin-transform-runtime",
        "transform-es2015-template-literals",
        "es6-promise",
        "react-loadable/babel",
        [
            "babel-plugin-named-asset-import",
            {
                "loaderMap": {
                    "svg": {
                        "ReactComponent": "@svgr/webpack?-svgo,+titleProp,+ref![path]"
                    }
                }
            }
        ],
        [
            "@babel/plugin-proposal-object-rest-spread",
            {
                "useBuiltIns": true
            }
        ],
        [
            "@babel/plugin-proposal-class-properties",
            {
                "loose": true
            }
        ]
    ],
    "env": {
        "cjs": {
            "presets": [
                [
                    "@babel/preset-env",
                    {
                        "loose": false
                    }
                ],
                [
                    "@babel/preset-react",
                    {
                        "loose": false
                    }
                ],
                [
                    "@babel/preset-typescript",
                    {
                        "loose": false
                    }
                ]
            ]
        },
        "test": {
            "presets": [
                "@babel/preset-env",
                "@babel/preset-typescript"
            ],
            "plugins": [
                "@babel/plugin-transform-modules-commonjs"
            ]
        },
        "node": {
            "presets": [
                [
                    "@babel/preset-env",
                    {
                        "targets": {
                            "node": "14"
                        },
                        "modules": false
                    }
                ],
                [
                    "@babel/preset-typescript",
                    {
                        "targets": {
                            "node": "14"
                        },
                        "modules": false
                    }
                ]
            ]
        }
    }
}
```

Add the following part into `package.json` for fatal errors on warnings for eslint in jest:

```json
{
    "jest-runner-eslint": {
        "cliOptions": {
            "maxWarnings": 0
        }
    },
    "nodemonConfig": {
        "delay": 140
    }
}
```

Add `.eslintrc`, `tsconfig.json`, `jest.config.js` in root/packages/package-dirs like wanted.

Used by, check the `packerConfig.js` there:

- [UI Schema](https://github.com/ui-schema/ui-schema)
- [Control UI](https://github.com/control-ui/control-ui)
- [Icon1](https://github.com/bemit/icon1), incl. `backends`

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2022 [Michael Becker](https://mlbr.xyz)

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.
