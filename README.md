# Lerna Packer

React multi-app and component build handling for lerna monorepo.

    npm init
    npm i --save lerna lerna-packer
    
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
        vendors: []
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

packer(apps, packages, __dirname);
```

Add scripts to `package.json`:

```json
{
    "scripts": {
        "start": "npm run clean-dist && npm run hoist && npm run serve",
        "serve": "cross-env NODE_ENV=development node packerConfig.js --serve",
        "prebuild": "npm run clean-dist && npm run hoist",
        "build": "npm run build-babel && npm run build-webpack && npm run dtsgen",
        "build-babel": "cross-env NODE_ENV=production CI=true node packerConfig.js --build --babel",
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
        }
    }
}
```

Add `.eslintrc`, `tsconfig.json` in root/packages/package-dirs like wanted, example in e.g. [UI Schema](https://github.com/ui-schema/ui-schema)
