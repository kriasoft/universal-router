const { basename, normalize } = require('path');
const { readFile: readFileCb } = require('fs');
const { promisify } = require('util');
const readFile = promisify(readFileCb);

const kolor = require('kleur');
const prettyBytes = require('pretty-bytes');
const brotliSize = require('brotli-size');
const gzipSize = require('gzip-size');
const { log } = console;
const pkg = require('../package.json');

main();

async function main() {
  const args = process.argv.splice(2);
  const filePaths = [...args.map(normalize)];
  const fileMetadata = await Promise.all(
    filePaths.map(async (filePath) => {
      return {
        path: filePath,
        blob: await readFile(filePath, { encoding: 'utf8' }),
      };
    })
  );

  const output = await Promise.all(
    fileMetadata.map((metadata) => getSizeInfo(metadata.blob, metadata.path))
  );

  log(getFormatedOutput(pkg.name, output));
}

/**
 *
 * @param {string} pkgName
 * @param {string[]} filesOutput
 */
function getFormatedOutput(pkgName, filesOutput) {
  const MAGIC_INDENTATION = 3;
  const WHITE_SPACE = ' '.repeat(MAGIC_INDENTATION);

  return kolor.bold(kolor.cyan(`${pkgName} bundle sizes: 📦`)) + `\n` + filesOutput.join(`\n`);
}

/**
 *
 * @param {number} size
 * @param {string} filename
 * @param {'br' | 'gz' | ''} type
 * @param {boolean} raw
 */
function formatSize(size, filename, type, raw) {
  const pretty = raw || size < 1000 ? `${size}  B` : prettyBytes(size);
  /** @type {(str:string) => string} */
  const color = (str) =>
    kolor.bold(size < 5000 ? kolor.green(str) : size > 40000 ? kolor.red(str) : kolor.yellow(str));

  return `  ${basename(filename)}${type ? `.${kolor.bold(type)}` : '   '}  ${color(
    pretty.padStart(10)
  )}`;
}

/**
 *
 * @param {string} code
 * @param {string} filename
 * @param {boolean} [raw=false]
 */
async function getSizeInfo(code, filename, raw = false) {
  const size = code.length;
  const isRaw = raw || size < 5000;
  const gziped = await gzipSize(code);
  const brotlied = await brotliSize(code);
  const orig = formatSize(size, filename, '', isRaw);
  const gzip = formatSize(gziped, filename, 'gz', isRaw);
  const brotli = formatSize(brotlied, filename, 'br', isRaw);
  /** @type {(str:number) => string} */
  const percent = (num) => kolor.gray(`${(num * 100).toFixed(1)}%`);

  return `\n${orig}\n${gzip}  ${percent(gziped / size)}\n${brotli}  ${percent(brotlied / size)}`;
}
