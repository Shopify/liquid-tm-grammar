// This code is heavily inspired by microsoft/TypeScript-TmLanguage/tests/build.ts
const vt = require('vscode-textmate');
const path = require('path');
const fs = require('fs');

const GrammarKind = {
  liquid: 'text.html.liquid',
};

function grammarPath(kind) {
  return path.join(__dirname, '..', grammarFileNames[kind]);
}

const grammarFileNames = {
  [GrammarKind.liquid]: 'liquid.tmLanguage.json',
};

const grammarPaths = {
  [GrammarKind.liquid]: grammarPath(GrammarKind.liquid),
};

const registry = new vt.Registry({
  loadGrammar: function (scopeName) {
    const path = grammarPaths[scopeName];
    if (path) {
      return new Promise((resolve, reject) => {
        fs.readFile(path, (error, content) => {
          if (error) {
            reject(error);
          } else {
            const rawGrammar = vt.parseRawGrammar(
              content.toString(),
              path,
            );
            resolve(rawGrammar);
          }
        });
      });
    }

    return Promise.resolve(null);
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

function hasDiff(first, second, hasDiffT) {
  if (first.length != second.length) {
    return true;
  }

  for (let i = 0; i < first.length; i++) {
    if (hasDiffT(first[i], second[i])) {
      return true;
    }
  }

  return false;
}

function makeTsScope(scope) {
  return scope.replace(/\.tsx/g, '.ts');
}

function hasDiffScope(first, second) {
  return makeTsScope(first) !== makeTsScope(second);
}

function hasDiffLineToken(first, second) {
  return (
    first.startIndex != second.startIndex ||
    first.endIndex != second.endIndex ||
    hasDiff(first.scopes, second.scopes, hasDiffScope)
  );
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
    scope.endsWith('.js')
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
    getInputFile(cleanLines) +
    getBaseline(mainGrammar, baselineLines)
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

exports.generateScopes = function generateScopes(
  text,
) {
  const mainGrammar = liquidGrammar;
  const oriLines = text.split(/\r\n|\r|\n/);

  return mainGrammar.grammar.then((mainIGrammar) =>
    generateScopesWorker(
      initGrammar(mainGrammar.kind, mainIGrammar),
      oriLines,
    ),
  );
};
