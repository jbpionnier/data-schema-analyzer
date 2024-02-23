# data-schema-analyzer

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image]

> [!WARNING]
> This package is primarily published to receive early feedback and for contributors, during this development phase we cannot guarantee the stability of the APIs, consider each release to contain breaking changes.

## :package: Installation

To install the module from npm:

```bash
npm install data-schema-analyzer
```

## :blue_book: Usage

### Generate Schema

```typescript
// ./examples/stub-type.ts

export type StubType = {
  id: number
  name: string
  /**
   * @minimum 0
   */
  age: number
}
```
You can use annotations to add more information to the schema :
- `@minimum` : Add a minimum value to the number
- `@maximum` : Add a maximum value to the number
- `@pattern` : Add a RegEx to the string
- `@id` : Add a unique identifier to the object
- `@minLength` : Add a minimum length to the string
- `@maxLength` : Add a maximum length to the string
- `@minItems` : Add a minimum number of items to the array
- `@maxItems` : Add a maximum number of items to the array


Use the `SchemaGenerator` to generate the schema from the typescript file.

```typescript
// ./scripts/generate-schema.ts
import { SchemaGenerator } from 'data-schema-analyzer'

const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.json',
})
const schema = generator.generateFile({
  sourceFiles: ['./examples/stub-type.ts'],
  rootInterfaceName: 'StubType',
  outputFilePath: './examples/stub-type-schema.json', // Typescript interface or JSON File
})
```

### Track the data
```typescript
import { Tracker } from 'data-schema-analyzer'
import { StubType } from './examples/stub-type'

const tracker = new Tracker<StubType>({
  schema,
})

const analyze = tracker.analyze()

//...
const report = analyze.track({ id: 1, name: 'John Doe', age: 'Not a number' })
// {
//   "properties": [
//     {
//       "type": "TYPE",
//       "property": "age"
//       "message": "age property type is not number",
//       "example": "Not a number"
//     },
//   ]
// }

// ...
const report = analyze.track({ id: 2, name: 'Kevin', age: -5 })
// {
//   "properties": [
//     {
//       "type": "TYPE",
//       "property": "age"
//       "message": "age property must be at least 0",
//       "example": -1
//     },
//   ]
// }

const analyzeReport = analyze.end()
// Other information from the data like the number of records, the number of errors, etc.
```

And add the script to your `package.json`:
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
https://github.com/Effect-TS/effect/tree/main/packages/schema
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
