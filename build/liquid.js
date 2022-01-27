const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const loadYaml = (file) =>
  yaml.load(fs.readFileSync(file, 'utf8'), { json: true });

const tags = loadYaml(path.join(__dirname, '../liquid/tags.yml'));
const objects = loadYaml(path.join(__dirname, '../liquid/objects.yml'));
const operators = loadYaml(path.join(__dirname, '../liquid/operators.yml'));

const isObject = (x) => typeof x == 'object' && !Array.isArray(x);

module.exports = {
  ALL_TAGS: tags.flatMap((x) =>
    isObject(x) ? Object.entries(x)[0] : x,
  ),
  ALL_BLOCK_OPEN_TAGS: tags
    .filter(isObject)
    .map((x) => Object.keys(x)[0]),
  ALL_BLOCK_END_TAGS: tags
    .filter(isObject)
    .map((x) => Object.values(x)[0]),
  ALL_GLOBAL_OBJECTS: objects,
  ALL_OPERATORS: operators,
};
