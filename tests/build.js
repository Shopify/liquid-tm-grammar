// This code is heavily inspired by microsoft/TypeScript-TmLanguage/tests/build.ts
const vt = require('vscode-textmate');
const path = require('path');
const fs = require('fs');
const oniguruma = require('vscode-oniguruma');

const GrammarKind = {
  liquid: 'text.html.liquid',
  liquidInjection: 'liquid.injection',
  html: 'text.html.basic',
  css: 'source.css',
  javascript: 'source.js',
  json: 'source.json',
};

function grammarPath(kind) {
  return path.join(__dirname, '../grammars', grammarFileNames[kind]);
}

function supportGrammarPath(kind) {
  return path.join(__dirname, 'syntaxes', grammarFileNames[kind]);
}

const grammarFileNames = {
  [GrammarKind.liquid]: 'liquid.tmLanguage.json',
  [GrammarKind.liquidInjection]: 'liquid-injection.tmLanguage.json',

  // Support grammars
  [GrammarKind.html]: 'html.tmLanguage.json',
  [GrammarKind.css]: 'css.tmLanguage.json',
  [GrammarKind.javascript]: 'javascript.tmLanguage.json',
  [GrammarKind.json]: 'json.tmLanguage.json',
};

const grammarPaths = {
  [GrammarKind.liquid]: grammarPath(GrammarKind.liquid),
  [GrammarKind.liquidInjection]: grammarPath(
    GrammarKind.liquidInjection,
  ),
  [GrammarKind.html]: supportGrammarPath(GrammarKind.html),
  [GrammarKind.css]: supportGrammarPath(GrammarKind.css),
  [GrammarKind.javascript]: supportGrammarPath(
    GrammarKind.javascript,
  ),
  [GrammarKind.json]: supportGrammarPath(GrammarKind.json),
};

const wasmBin = fs.readFileSync(
  path.join(
    __dirname,
    '../node_modules/vscode-oniguruma/release/onig.wasm',
  ),
).buffer;
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
  return {
    createOnigScanner(patterns) {
      return new oniguruma.OnigScanner(patterns);
    },
    createOnigString(s) {
      return new oniguruma.OnigString(s);
    },
  };
});

const registry = new vt.Registry({
  onigLib: vscodeOnigurumaLib,
  loadGrammar(scopeName) {
    const path = grammarPaths[scopeName];
    if (path) {
      return fs.promises
        .readFile(path, 'utf8')
        .then((content) => vt.parseRawGrammar(content, path));
    }

    return Promise.resolve(null);
  },

  getInjections(scopeName) {
    if (scopeName == 'text.html.liquid') {
      return ['liquid.injection'];
    }
  },
});

function thenableGrammar(kind) {
  return { kind, grammar: registry.loadGrammar(kind) };
}
const liquidGrammar = thenableGrammar(GrammarKind.liquid);

function getInputFile(oriLines) {
  return (
    'original file\n-----------------------------------\n' +
    oriLines.join('\n') +
    '\n-----------------------------------\n\n'
  );
}

function getGrammarInfo(kind) {
  return (
    'Grammar: ' +
    grammarFileNames[kind] +
    '\n-----------------------------------\n'
  );
}

function initGrammar(kind, grammar) {
  return { kind, grammar };
}

function tokenizeLine(grammar, line) {
  const lineTokens = grammar.grammar.tokenizeLine(
    line,
    grammar.ruleStack,
  );
  grammar.ruleStack = lineTokens.ruleStack;
  return lineTokens.tokens;
}

function getBaseline(grammar, outputLines) {
  return getGrammarInfo(grammar.kind) + outputLines.join('\n');
}

function validateTokenScopeExtension(grammar, token) {
  return !token.scopes.some(
    (scope) => !isValidScopeExtension(grammar, scope),
  );
}

function isValidScopeExtension(_grammar, scope) {
  return (
    scope.endsWith('.liquid') ||
    scope.endsWith('.html') ||
    scope.endsWith('.css') ||
    scope.endsWith('.js') ||
    scope.endsWith('.json') ||
    scope.endsWith('ignored-vscode')
  );
}

function generateScopesWorker(mainGrammar, oriLines) {
  let cleanLines = [];
  let baselineLines = [];
  let otherBaselines = [];
  for (const i in oriLines) {
    let line = oriLines[i];

    const mainLineTokens = tokenizeLine(mainGrammar, line);

    cleanLines.push(line);
    baselineLines.push('>' + line);
    otherBaselines.push('>' + line);

    for (let token of mainLineTokens) {
      writeTokenLine(mainGrammar, token, baselineLines);
    }
  }

  return (
    getInputFile(cleanLines) + getBaseline(mainGrammar, baselineLines)
  );
}

function writeTokenLine(grammar, token, outputLines) {
  let startingSpaces = ' ';
  for (let j = 0; j < token.startIndex; j++) {
    startingSpaces += ' ';
  }

  let locatingString = '';
  for (let j = token.startIndex; j < token.endIndex; j++) {
    locatingString += '^';
  }
  outputLines.push(startingSpaces + locatingString);
  outputLines.push(
    `${startingSpaces}${token.scopes.join(' ')}${
      validateTokenScopeExtension(grammar, token)
        ? ''
        : ' INCORRECT_SCOPE_EXTENSION'
    }`,
  );
}

exports.generateScopes = function generateScopes(text) {
  const mainGrammar = liquidGrammar;
  const oriLines = text.split(/\r\n|\r|\n/);

  return mainGrammar.grammar.then((mainIGrammar) =>
    generateScopesWorker(
      initGrammar(mainGrammar.kind, mainIGrammar),
      oriLines,
    ),
  );
};
