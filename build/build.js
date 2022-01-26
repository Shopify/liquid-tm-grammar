const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  ALL_TAGS,
  ALL_BLOCK_OPEN_TAGS,
  ALL_BLOCK_END_TAGS,
  ALL_GLOBAL_OBJECTS,
} = require('./liquid');

function merge(a, b) {
  return {
    ...a,
    ...b,
  };
}

function replacePlaceholders(fileContents) {
  const context = {
    ANY_TAG: ALL_TAGS.join('|'),
    ANY_BLOCK_OPEN_TAG: ALL_BLOCK_OPEN_TAGS.join('|'),
    ANY_BLOCK_END_TAG: ALL_BLOCK_END_TAGS.join('|'),
    ANY_GLOBAL_OBJECT: ALL_GLOBAL_OBJECTS.join('|'),
  };
  return fileContents.replace(
    /<%= ([a-z_]+) %>/gi,
    (_, varName) => context[varName],
  );
}

async function loadYamlFileAsJson(file) {
  const rawFileContents = await fs.promises.readFile(file, 'utf8');
  return yaml.load(replacePlaceholders(rawFileContents), {
    filename: file,
    json: true,
  });
}

module.exports = async function build(file) {
  const dirName = path.dirname(file);
  const baseName = path.basename(file, '.YAML-tmLanguage');
  try {
    console.error(`Converting ${file}`);
    const start = Date.now();
    const [baseSyntax, fileSyntax] = await Promise.all([
      loadYamlFileAsJson(path.join(dirName, 'base-syntax.yml')),
      loadYamlFileAsJson(file),
    ]);
    const syntax = merge(fileSyntax, baseSyntax);

    await fs.promises.writeFile(
      path.join(dirName, baseName + '.tmLanguage.json'),
      JSON.stringify(syntax, null, 2),
      'utf8',
    );
    console.error(
      `Succesfully built ${baseName}.tmLanguage.json in ${(
        Date.now() - start
      ).toFixed(0)} ms`,
    );
  } catch (e) {
    console.error(e);
  }
};
