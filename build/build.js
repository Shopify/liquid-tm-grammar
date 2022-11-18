const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  ALL_TAGS,
  ALL_BLOCK_OPEN_TAGS,
  ALL_BLOCK_END_TAGS,
  ALL_GLOBAL_OBJECTS,
  ALL_OPERATORS,
} = require('./liquid');

function merge(a, b) {
  return {
    ...a,
    ...b,
  };
}

function escapeRegex(string) {
  return string.replace(/[><=]/g, '\\$&');
}

// OK this is SUPER weird. So whenever you inject a rule, for some reason
// the injected rule will popout and try to match top level rules before
// match patterns if it starts right after the begin match.
//
// e.g. if you have '{% raw %}{{ product.feature }}{% endraw %}'
// then the algo will match product.feature as a normal object even though
// the child rules for {% raw %} should gob those up. So the hack here is
// to include a backtrack for the common prefixes and not match when the
// open tag/variable is preceded by an opening raw or comment tag.
const ABSURD_COMMENT_RAW_BACKTRACK = [
  'comment %}',
  'comment -%}',
  'comment%}',
  'comment-%}',
  'raw %}',
  'raw -%}',
  'raw%}',
  'raw-%}',
]
  .map((x) => `(?<!${x})`)
  .join('');

function replacePlaceholders(fileContents) {
  const context = {
    ANY_TAG: ALL_TAGS.join('|'),
    ANY_BLOCK_OPEN_TAG: ALL_BLOCK_OPEN_TAGS.join('|'),
    ANY_BLOCK_END_TAG: ALL_BLOCK_END_TAGS.join('|'),
    ANY_GLOBAL_OBJECT: ALL_GLOBAL_OBJECTS.join('|'),
    ANY_OPERATOR: ALL_OPERATORS.map(escapeRegex).join('|'),
    ABSURD_COMMENT_RAW_BACKTRACK,
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

function log(msg) {
  console.error(
    `[${new Date().toISOString().replace(/\..*$/, '')}] ${msg}`,
  );
}

module.exports = async function build(file) {
  const dirName = path.dirname(file);
  const baseName = path.basename(file, '.yml');
  try {
    log(`Converting ${file}`);
    const start = Date.now();
    const [baseSyntax, fileSyntax] = await Promise.all([
      loadYamlFileAsJson(path.join(dirName, 'base-syntax.yml')),
      loadYamlFileAsJson(file),
    ]);
    const syntax = merge(fileSyntax, baseSyntax);

    await fs.promises.writeFile(
      path.join(dirName, 'grammars', baseName + '.tmLanguage.json'),
      JSON.stringify(syntax, null, 2),
      'utf8',
    );
    log(
      `Successfully built ${baseName}.tmLanguage.json in ${(
        Date.now() - start
      ).toFixed(0)} ms`,
    );
  } catch (e) {
    console.error(e);
  }
};
