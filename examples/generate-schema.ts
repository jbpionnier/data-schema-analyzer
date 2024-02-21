import { SchemaGenerator, Tracker } from '../src'

// Generate schema json from a file
const generator = new SchemaGenerator({
  tsConfigFilePath: './tsconfig.spec.json',
})

const stubTypeSchema = generator.generateFile({
  sourceFiles: ['examples/stub-type.ts'],
  rootInterfaceName: 'StubType',
  outputFilePath: './examples/stub-type-schema.json',
})

// Track a data from schema json
const tracker = new Tracker<any>({ schema: stubTypeSchema })
const analyze = tracker.analyze()
const report = analyze.track({
  myListNumber: [],
  myListString: [],
  myString: '',
  mySubType: { age: 0 },
  mySubTypeByRefList: [],
})

console.log('Report ok !')
if (report.properties.length != 9) {
  console.error('Expected 9 properties, got', report.properties.length)
  process.exit(1)
}
