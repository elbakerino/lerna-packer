# Lerna Packer

[![MIT license](https://img.shields.io/npm/l/@ui-schema/ui-schema?style=flat-square)](https://github.com/ui-schema/ui-schema/blob/master/LICENSE)
[![npm (scoped)](https://img.shields.io/npm/v/lerna-packer?style=flat-square)](https://www.npmjs.com/package/lerna-packer)

React multi-app and package build handling for [lerna](https://github.com/lerna/lerna) monorepos.

**App**: webpack serving and building, scss/css support, public folder etc. - similar to create-react apps.

**Backends**: NodeJS backend server, building/watching with babel and serving with nodemon.

**Packages**: publishable packages, can be used by apps directly, production built with babel.

**Supports**: ESNext, React, TypeScript, d.ts Generation, Sass, Code Split compatible, es-modules and commonjs, Jest and Testing Library, ...

    npm init
    npm i --save lerna lerna-packer

> **experimental**, fix the version without any modifier

Add `packerConfig.js` with configs for apps and packages (component libraries):

```js
const path = require('path');
const {buildExternal, packer} = require('lerna-packer');

const apps = {
    docs: {
        root: path.resolve(__dirname, 'packages', '_docs-control'),
        template: path.resolve(__dirname, 'packages', '_docs-control/public/index.html'),
        publicPath: path.resolve(__dirname, 'packages', '_docs-control/public'),// dev-server
        port: 9219,
        main: path.resolve(__dirname, 'packages', '_docs-control/src/index.tsx'),
        dist: path.resolve(__dirname, 'dist', 'docs-control'),
        servedPath: '/', // todo: make package.json homepage dependent
        vendors: [],
        plugins: [],
    },
};

const backends = {
    someApi: {
        root: path.resolve(__dirname, 'packages', 'some-api'),
        src: 'src',
        entry: 'server.js',
    },
};

const packages = {
    // the keys are the commonjs names that is applied to externals
    // this is the same as `@babel/plugin-transform-modules-commonjs` applies
    controlKit: {
        name: '@control-ui/kit',
        root: path.resolve(__dirname, 'packages', 'control-kit'),
        entry: path.resolve(__dirname, 'packages', 'control-kit/src/'),
        externals: {
            react: buildExternal("react"),
            "react-dom": buildExternal("react-dom"),
            "@material-ui/core": buildExternal("@material-ui/core"),
            "@material-ui/icons": buildExternal("@material-ui/icons"),
        }
    },
    controlApp: {
        name: '@control-ui/app',
        root: path.resolve(__dirname, 'packages', 'control-app'),
        entry: path.resolve(__dirname, 'packages', 'control-app/src/'),
        externals: {
            react: buildExternal("react"),
            "react-dom": buildExternal("react-dom"),
            "@material-ui/core": buildExternal("@material-ui/core"),
            "@material-ui/icons": buildExternal("@material-ui/icons"),
        }
    },
};

packer(
    // apps and packages are required, backends are optional
    {apps, backends, packages},
    __dirname
);
```

Add scripts to `package.json`:

```json
{
    "scripts": {
        "start": "npm run clean-dist && npm run hoist && npm run serve",
        "serve": "cross-env NODE_ENV=development node packerConfig.js --serve",
        "prebuild": "npm run clean-dist && npm run hoist",
        "build": "npm run build-babel && npm run build-backend && npm run dtsgen && npm run build-webpack",
        "build-babel": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --babel",
        "build-backend": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --backend",
        "build-webpack": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --webpack",
        "clean": "npm run clean-dist && lerna clean -y",
        "clean-dist": "node packerConfig.js --clean",
        "dtsgen": "lerna run dtsgen",
        "bootstrap": "lerna bootstrap",
        "hoist": "lerna bootstrap --hoist",
        "test": "jest -c=\"packages/jest.config.js\"",
        "tdd": "npm test -- --watch --watchman --coverage=false",
        "release": "lerna publish from-package --no-git-reset"
    }
}
```

Add `babel.config.json` or similiar:

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
        "delay": 120
    }
}
```

Add `.eslintrc`, `tsconfig.json`, `jest.config.js` in root/packages/package-dirs like wanted, example in e.g. [UI Schema](https://github.com/ui-schema/ui-schema)

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2021 [Michael Becker](https://mlbr.xyz)

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.
