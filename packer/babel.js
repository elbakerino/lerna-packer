const path = require('path');
const {spawn} = require('cross-spawn');
const {createModulePackages} = require('./modulePackages');

const spawnBabel = (args) => {
    // todo: babel path is risky, need to be checked for existence/should use normal module resolution
    return spawn(require.resolve('../../.bin/babel'), args, {stdio: 'inherit'});
};

function buildEsModules(packages, targets = [
    {distSuffix: '', args: ['--env-name', 'cjs', '--copy-files', '--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
    {distSuffix: '/esm', args: ['--extensions', '.ts', '--extensions', '.tsx', '--extensions', '.js', '--extensions', '.jsx', '--ignore', '**/*.d.ts']},
]) {

    const babels = [];
    Object.keys(packages).forEach(pack => {
        babels.push(...targets.map(target => new Promise((resolve, reject) => {
            const entry = packages[pack].entry;
            const dist = path.resolve(packages[pack].root, 'build' + target.distSuffix);

            let args = [entry, ...target.args, '--out-dir', dist];

            if(-1 === process.argv.indexOf('--clean')) {
                let babel = spawnBabel(args);
                babel.on('exit', code => {
                    if(code !== 0) {
                        reject('Babel transpilation failed: ' + code);
                    } else {
                        resolve();
                    }
                });
            }
        })));
    });

    return new Promise((resolve, reject) => {
        Promise.all(babels)
            .then((e) => {
                if(e.length === babels.length) {
                    console.log('Builded ES6 modules!');
                    const packs = Object.keys(packages).map(pack =>
                        createModulePackages(path.resolve(packages[pack].root, 'build'))
                    );
                    Promise.all(packs).then((e) => {
                        if(e.length === packs.length) {
                            resolve();
                        }
                    })
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}

exports.buildEsModules = buildEsModules;
