# data-schema-analyzer
[![npm version](https://badge.fury.io/js/data-schema-analyzer.svg)](https://badge.fury.io/js/data-schema-analyzer)

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

https://github.com/PengJiyuan/ts-document
https://github.com/xdoer/json-types-generator
https://github.com/idurar/fast-graphql
https://github.com/Code-Hex/graphql-codegen-typescript-validation-schema
https://github.com/nijikokun/generate-schema
https://github.com/xiag-ag/typescript-to-json-schema
https://github.com/timqian/gql-generator

https://ts-morph.com/manipulation/structures
https://ts-ast-viewer.com/
https://github.com/PengJiyuan/ts-document/blob/main/src/generate.ts
https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts
-->
