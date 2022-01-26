const fs = require('fs');
const build = require('./build');

async function main() {
  await Promise.all(
    fs
      .readdirSync('.')
      .filter((file) => file.endsWith('YAML-tmLanguage'))
      .map((file) => build(file)),
  );
}

main();
