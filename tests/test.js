const fs = require('fs');
const path = require('path');
const chai = require('chai');
const build = require('./build');

const generatedFolder = path.join(__dirname, 'generated');
const baselineFolder = path.join(__dirname, 'baselines');
const casesFolder = path.join(__dirname, 'cases');

chai.config.includeStack = false; // turn on stack trace
chai.config.truncateThreshold = 0; // disable truncating

function ensureCleanGeneratedFolder() {
  if (fs.existsSync(generatedFolder)) {
    for (const fileName of fs.readdirSync(generatedFolder)) {
      fs.unlinkSync(path.join(generatedFolder, fileName));
    }
    fs.rmdirSync(generatedFolder);
  }
  fs.mkdirSync(generatedFolder);
}

// Ensure generated folder
ensureCleanGeneratedFolder();

for (const fileName of fs.readdirSync(casesFolder)) {
  const parsedFileName = path.parse(fileName);
  const baselineBaseName = parsedFileName.name + '.baseline.txt';
  const generatedFileName = path.join(
    generatedFolder,
    baselineBaseName,
  );
  const text = fs.readFileSync(
    path.join(casesFolder, fileName),
    'utf8',
  );
  const baselineFile = path.join(baselineFolder, baselineBaseName);

  describe(path.join('tests/cases', fileName), function () {
    this.timeout(100000);
    let generatedText;

    before(async () => {
      // Generate the new baselines
      generatedText = await build.generateScopes(text);
      fs.writeFileSync(generatedFileName, generatedText);
    });

    after(() => {
      generatedText = undefined;
    });

    it('should not hold INCORRECT_SCOPE_EXTENSION', () => {
      generatedText.split('\n').forEach((line) => {
        chai.assert.notMatch(
          line,
          /INCORRECT_SCOPE_EXTENSION/,
          'Expected all scopes to end in .$lang',
        );
      });
    });

    if (fs.existsSync(baselineFile)) {
      const baselineText = fs.readFileSync(baselineFile, 'utf8');
      const baselineChunks = getChunks(baselineText);

      for (let i = 0; i < baselineChunks.length; i++) {
        if ([0, 2].includes(i)) continue;
        it(
          i === 1
            ? 'should have equal original files'
            : `should tokenize line ${i - 2} the same way `,
          () => {
            const generatedChunks = getChunks(generatedText);
            const expected = baselineChunks[i];
            const actual = generatedChunks[i];
            chai
              .expect(actual)
              .to.equal(expected, 'Chunks should be equal');
          },
        );
      }
    } else {
      it('is a new baseline', () => {
        chai.assert(false, 'New generated baseline' + '\n' + generatedText);
      });
    }
  });
}

function getChunks(text) {
  return text
    .split(/\n*---+\n*/g)
    .flatMap((chunk) => chunk.split(/^>/gm))
    .map(x => x.trim())
    .filter(Boolean);
}

process.on('unhandledRejection', (error) => {
  console.error(error);
});
