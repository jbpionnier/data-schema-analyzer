import * as fs from 'node:fs'
import { SchemaGenerator, Tracker } from '../src'

// Generate schema json from a file
const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.spec.json',
})

const stubTypeSchema = generator.generate({
  sourceFiles: ['examples/stub-type.ts'],
  rootInterfaceName: 'StubType',
})
fs.writeFileSync('./examples/stub-type-schema.json', JSON.stringify(stubTypeSchema, null, 2))

// Track a data from schema json
const tracker = new Tracker<any>({ schema: stubTypeSchema })
const analyze = tracker.analyze()
const report = analyze.track({
  myListNumber: [],
  myListString: [],
  myString: '',
  mySubType: { age: 0 },
  mySubTypeByRefList: []
})

console.log('Report ok !')
if (report.properties.length != 10) {
  console.error('Expected 10 properties, got', report.properties.length)
  process.exit(1)
}
