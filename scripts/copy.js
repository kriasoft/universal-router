/**
 * This file only purpose is to copy files before npm publish and strip churn/security sensitive metadata from package.json
 *
 * **NOTE:**
 * 👉 This file should not use any 3rd party dependency
 */
const { writeFileSync, copyFileSync, statSync } = require('fs');
const { resolve, basename } = require('path');
const packageJson = require('../package.json');

main();

function main() {
  const projectRoot = resolve(__dirname, '..');
  const distPath = resolve(projectRoot, 'dist');
  const distPackageJson = createDistPackageJson(packageJson);

  const cpFiles = ['README.md', 'CHANGELOG.md', 'LICENSE.md', '.npmignore'].map((file) =>
    resolve(projectRoot, file)
  );

  cp(cpFiles, distPath);

  writeFileSync(resolve(distPath, 'package.json'), distPackageJson);
}

/**
 *
 * @param {string[]|string} source
 * @param {string} target
 */
function cp(source, target) {
  const isDir = statSync(target).isDirectory();

  if (isDir) {
    if (!Array.isArray(source)) {
      throw new Error('if <target> is directory you need to provide source as an array');
    }

    source.forEach((file) => copyFileSync(file, resolve(target, basename(file))));

    return;
  }

  copyFileSync(/** @type {string} */ (source), target);
}

/**
 * @param {typeof packageJson} packageConfig
 * @return {string}
 */
function createDistPackageJson(packageConfig) {
  const {
    devDependencies,
    scripts,
    engines,
    config,
    husky,
    'lint-staged': lintStaged,
    ...distPackageJson
  } = packageConfig;

  return JSON.stringify(distPackageJson, null, 2);
}
