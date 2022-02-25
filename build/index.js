const fs = require('fs');
const build = require('./build');

async function main() {
  await Promise.all(
    fs
      .readdirSync('.')
      .filter((file) => file.endsWith('yml'))
      .filter((file) => !file.match(/base-syntax/))
      .map((file) => build(file)),
  );
}

main();
