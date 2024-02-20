import { SchemaGenerator } from '../index'
import { RootSchema } from '../schema'

describe('Schema Generator', () => {
  it('should generate schema', () => {
    const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.spec.json' })
    const schema = generator.generate({
      sourceFiles: ['./examples/stub-type.ts'],
      rootInterfaceName: 'StubType',
    })

    const rootSchemaJson: RootSchema = {
      name: 'StubType',
      type: 'object',
      properties: {
        myString: { minLength: 1, maxLength: 3, pattern: '^\\w+$', id: true, required: true, type: 'string' },
        myNumber: { type: 'number' },
        myBoolean: { type: 'boolean' },
        myObject: { type: 'object' },
        myInteger: { type: 'integer' },
        myNull: { type: 'null' },
        myAny: { type: 'object' },
        myEnumString: { required: true, type: 'enum', values: ['ping', 'pong'], ignoreUnusedValues: true },
        myEnumNumber: { required: true, type: 'enum', values: ['1', '2', '3'] },
        mySubType: {
          type: 'object',
          required: true,
          properties: {
            age: { exclusiveMinimum: 0, minimum: 1, maximum: 99, exclusiveMaximum: 100, required: true, type: 'number' },
            subProp: { type: 'string' },
          },
        },
        myListString: { required: true, type: 'array', items: { type: 'string' } },
        myListNumber: { minItems: 1, maxItems: 5, required: true, type: 'array', items: { type: 'number' } },
        myTupleNumber: { required: true, type: 'array', items: { type: 'number' } },
        myTupleEmpty: { required: true, type: 'array', items: { type: 'object' } },
        myListObject: { type: 'array', items: { type: 'object' }, ignoreUnusedProperty: true },
        myListEnumString: { required: true, type: 'array', items: { type: 'enum', values: ['ping', 'pong'] } },
        myListEnumNumber: { type: 'array', items: { type: 'enum', values: ['1', '2', '3'] } },
        myList: {
          required: true,
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subProp: { minLength: 1, required: true, type: 'string' },
            },
          },
        },
        mySubTypeByRef: {
          type: 'object',
          properties: {
            age: { minimum: 1, required: true, type: 'number' },
            shareability: { required: true, type: 'enum', values: ['NOTSHARED'] },
          },
        },
        mySubTypeByRefList: {
          required: true,
          type: 'array',
          items: {
            type: 'object',
            properties: {
              age: { minimum: 1, required: true, type: 'number' },
              shareability: { required: true, type: 'enum', values: ['NOTSHARED'] },
            },
          },
        },
        combineObject: {
          type: 'object',
          required: true,
          properties: {
            a: { type: 'string', required: true },
            b: { type: 'number', required: true },
            c: { type: 'boolean', required: true },
          },
        },
      },
    }

    expect(schema).toEqual(rootSchemaJson)
  })
})
