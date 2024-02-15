import * as fs from 'node:fs'
import { SchemaGenerator, Tracker } from '../src'

// Generate schema json from a file
const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.spec.json',
})

const stubTypeSchema = generator.generate({
  fileNameOrPath: 'examples/stub-type.ts',
  rootInterfaceName: 'StubType',
})
fs.writeFileSync('./examples/stub-type-schema.json', JSON.stringify(stubTypeSchema, null, 2))

// Track a data from schema json
const tracker = new Tracker<any>({ schema: stubTypeSchema })

const report = tracker.track({
  myListNumber: [],
  myListString: [],
  myString: '',
  mySubType: { age: 0 },
  mySubTypeByRefList: []
})

if (report.properties.length != 8) {
  console.error('Expected 8 properties, got', report.properties.length)
  process.exit(1)
}
