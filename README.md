# data-schema-analyzer

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image]

> [!WARNING]
> Work in progress.

## :package: Installation

To install the module from npm:

```
npm install data-schema-analyzer
```

## :blue_book: Usage

```typescript
import { SchemaGenerator } from 'data-schema-analyzer'

const tracker = new Tracker<StubType>({
  schema: require('./examples/stub-type-schema.json'),
  logger: (message) => {
    // your logger
    console.log(message)
  },
})

const analyze = tracker.analyze()

//...
analyze.track({ id: 1, name: 'John Doe', age: 'Not a number' })
analyze.track({ id: 2, name: 'Kevin', age: -5 })
// ...

analyze.endAndPrint()

// Prints
// [TYPE] age property type is not number: "Not a number"
// [MINIMUM] age property value is too low (1 minimum): -5
```


### To Generate Schema

```typescript
// ./scripts/generate-schema.ts

import { SchemaGenerator } from 'data-schema-analyzer'

const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.json',
})

const stubTypeSchema = generator.generate({
  sourceFiles: ['./examples/stub-type.ts'],
  rootInterfaceName: 'StubType',
})
```

```
// package.json

 "scripts": {
  ...
  "generate:schema": "npx tsx ./scripts/generate-schema.ts"
 },
```

## :memo: License

[MIT](LICENSE.md)

<!--
Getting started
Ressources
https://github.com/PengJiyuan/ts-document
https://github.com/xdoer/json-types-generator
https://github.com/idurar/fast-graphql
https://github.com/Code-Hex/graphql-codegen-typescript-validation-schema
https://github.com/nijikokun/generate-schema
https://github.com/xiag-ag/typescript-to-json-schema
https://github.com/timqian/gql-generator

# Generator AST to JSON
https://github.com/YousefED/typescript-json-schema
https://github.com/vega/ts-json-schema-generator
https://github.com/PengJiyuan/ts-document/blob/main/src/generate.ts
https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts

TS Morph
https://ts-morph.com/manipulation/structures
https://ts-ast-viewer.com/
-->

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/jbpionnier/data-schema-analyzer/ci.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/jbpionnier/data-schema-analyzer/actions/workflows/ci.yml 'Github action'
[npm-image]: https://img.shields.io/npm/v/data-schema-analyzer/latest.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/data-schema-analyzer/v/latest 'npm'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
