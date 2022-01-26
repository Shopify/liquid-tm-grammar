const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

module.exports = async function build(file) {
  const dirName = path.dirname(file);
  const baseName = path.basename(file, '.YAML-tmLanguage');
  try {
    console.error(`Converting ${file}`);
    const start = Date.now();
    const contents = yaml.load(
      await fs.promises.readFile(file, 'utf8'),
      { filename: file, json: true },
    );

    await fs.promises.writeFile(
      path.join(dirName, baseName + '.tmLanguage.json'),
      JSON.stringify(contents, null, 2),
      'utf8',
    );
    console.error(`Succesfully built ${baseName}.tmLanguage.json in ${(Date.now() - start).toFixed(0)} ms`);
  } catch (e) {
    console.error(e);
  }
}
