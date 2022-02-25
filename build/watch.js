const fs = require('fs');
const build = require('./build');

// fs.watch is weird and runs twice for the same file change on macOS. So
// we do this thing where we merge two changes to avoid redoing it twice.
const runningSet = new Set();
async function throttledBuild(file) {
  if (runningSet.has(file)) return;
  runningSet.add(file);
  await build(file);
  runningSet.delete(file);
}

function buildAll() {
  // No dependency watch/build. Has some caveats but do we really need
  // watchman for this? Probably not.
  fs.readdirSync('.')
      .filter((file) => file.endsWith('yml'))
      .filter((file) => !file.match(/base-syntax/))
    .forEach((file) => {
      build(file);
    });
}

function main() {
  console.log('Watching files...');

  buildAll();

  fs.watch('.', (event, file) => {
    if (file.endsWith('base-syntax.yml')) return buildAll();
    if (!file.endsWith('.yml')) return;
    throttledBuild(file);
  });
}

main();
