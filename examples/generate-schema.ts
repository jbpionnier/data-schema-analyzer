import * as fs from 'node:fs'
import { SchemaGenerator } from '../src'

const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.spec.json',
})

const stubTypeSchema = generator.generate({
  fileNameOrPath: 'examples/stub-type.ts',
  rootInterfaceName: 'StubType',
})
fs.writeFileSync('./examples/stub-type-schema.json', JSON.stringify(stubTypeSchema, null, 2))
