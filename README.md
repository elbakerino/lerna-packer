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

Add `packerConfig.js` with configs for apps and packages (e.g. component libraries, shared universal JS).

> [check typescript definition](https://github.com/elbakerino/lerna-packer/blob/master/index.d.ts) for full configuration options

**Usage examples, check the `packerConfig.js` there:**

- [UI Schema](https://github.com/ui-schema/ui-schema)
- [Control UI](https://github.com/control-ui/control-ui)
- [Icon1](https://github.com/bemit/icon1), incl. `backends`

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2024 [Michael Becker](https://i-am-digital.eu)

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.
