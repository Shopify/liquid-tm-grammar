---

⚠ **NOTE:** For the time being, this is all false (WIP). But this is what we're going for. We'll remove this notice when this is no longer false.

---

<h1 align="center" style="position: relative;" >
  <br>
    <img src="https://github.com/Shopify/liquid-tm-grammar/blob/main/images/shopify_glyph.png?raw=true" alt="logo" width="150" height="160">
  <br>
  Shopify Liquid TextMate Grammar
  <br>
</h1>

<h4 align="center">The official syntax highlighting grammar for Shopify Liquid</h4>

This repository contains the official syntax highlighting rules for the [Shopify flavor of Liquid](https://shopify.dev/themes).

[Features](#features) | [Development](#development) | [Credits](#credits)

## Features

- 🎨 TextMate grammar (.tmLanguage) for Liquid that works in the following contexts:
  - ✅ [Visual Studio Code](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide#textmate-grammars)
  - ✅ [Atom Editor](https://flight-manual.atom.io/hacking-atom/sections/creating-a-legacy-textmate-grammar/)
  - ✅ [Sublime Text](https://www.sublimetext.com/docs/scope_naming.html)
  - ✅ [GitHub.com](https://github.com/GitHub/linguist)
- 💧 Multi-lingual support:
  - ✅ Liquid in HTML
  - 🔲 Liquid in JavaScript (soon)
  - 🔲 Liquid in CSS (soon)

## Development

Much like [microsoft/TypeScript-TmLanguage](https://github.com/microsoft/TypeScript-TmLanguage), the `.tmLanguage` files are maintained in [YAML](https://yaml.org/) to make them easier to consume and edit by humans.

The XML files are _generated_ by our build.

### Install dependencies

```
npm install
```

### Build

```
npm run build
```

### Testing

Turns out this is kind of hard to test. The folks at Microsoft have a text-based workflow that involves committing "baseline" outputs for a series of files. We're doing the same here.

First we run the tests, this turns a set of source liquid files into a textual representation of the syntax highlighting.

```
npm run test
```

Second we compare the result of those outputs with our accepted baseline.

```
npm run diff
```

If we judge the changes are OK, then we commit to those changes by accepting the results as our new baseline.

```
npm run accept
```

## Credits

- The first version of the syntax comes from [siteleaf/liquid-syntax-mode](https://github.com/siteleaf/liquid-syntax-mode)
