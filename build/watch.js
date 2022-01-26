const fs = require('fs');
const build = require('./build');

console.log('Watching files...');

// No dependency watch/build. Has some caveats but do we really need
// watchman for this? Probably not.
fs.readdirSync('.')
  .filter((file) => file.endsWith('YAML-tmLanguage'))
  .forEach((file) => {
    build(file);
  });

// fs.watch is weird and runs twice for the same file change on macOS. So
// we do this thing where we merge two changes to avoid redoing it twice.
const runningSet = new Set();
async function throttledBuild(file) {
  if (runningSet.has(file)) return;
  runningSet.add(file);
  await build(file);
  runningSet.delete(file);
}

fs.watch('.', (event, file) => {
  if (!file.endsWith('YAML-tmLanguage')) return;
  throttledBuild(file);
});
