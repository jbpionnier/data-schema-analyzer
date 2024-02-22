import { SchemaGenerator } from '../index'
import { ObjectType, RootSchema } from '../schema'

describe('Schema Generator', () => {
  it('should generate schema', () => {
    const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.spec.json' })
    const schema = generator.generate({
      sourceFiles: ['./examples/stub-type.ts'],
      rootInterfaceName: 'StubType',
    })

    const stubSubTypeSchema: ObjectType = {
      type: 'object',
      required: ['age', 'shareability'],
      properties: {
        age: { minimum: 1, type: 'number' },
        shareability: { type: 'string', enum: ['NOTSHARED'] },
      },
    }

    const rootSchemaJson: RootSchema = {
      $ref: 'StubType',
      definitions: {
        StubType: {
          type: 'object',
          required: [
            'myString',
            'myEnumString',
            'myEnumNumber',
            'myListString',
            'myListNumber',
            'myTupleNumber',
            'myTupleEmpty',
            'myListEnumString',
            'myList',
            'mySubTypeByRefList',
          ],
          properties: {
            myString: { minLength: 1, maxLength: 3, pattern: '^\\w+$', id: true, type: 'string' },
            myNumber: { type: 'number' },
            myBoolean: { type: 'boolean' },
            myObject: { type: 'object' },
            myInteger: { type: 'integer' },
            myNull: { type: 'null' },
            myAny: { type: 'object' },
            myEnumString: { type: 'string', enum: ['ping', 'pong'], ignoreUnusedValues: true },
            myEnumNumber: { type: 'string', enum: ['1', '2', '3'] },
            mySubType: {
              type: 'object',
              required: ['age'],
              properties: {
                age: { exclusiveMinimum: 0, minimum: 1, maximum: 99, exclusiveMaximum: 100, type: 'integer' },
                subProp: { type: 'string' },
              },
            },
            myListString: { type: 'array', items: { type: 'string' } },
            myListNumber: { minItems: 1, maxItems: 5, type: 'array', items: { type: 'number' } },
            myTupleNumber: { type: 'array', items: { type: 'number' } },
            myTupleEmpty: { type: 'array', items: { type: 'object' } },
            myListObject: { type: 'array', items: { type: 'object' }, ignoreUnusedProperty: true },
            myListEnumString: { type: 'array', items: { type: 'string', enum: ['ping', 'pong'] } },
            myListEnumNumber: { type: 'array', items: { type: 'string', enum: ['1', '2', '3'] } },
            myList: {
              type: 'array',
              items: {
                type: 'object',
                required: ['subProp'],
                properties: {
                  subProp: { minLength: 1, type: 'string' },
                },
              },
            },
            mySubTypeByRef: stubSubTypeSchema,
            mySubTypeByRefExtra: {
              type: 'object',
              required: ['age', 'shareability', 'extra'],
              properties: {
                ...stubSubTypeSchema.properties,
                extra: { type: 'boolean' },
              },
            },
            mySubTypeByRefList: {
              type: 'array',
              items: stubSubTypeSchema,
            },
            combineObject: {
              type: 'object',
              required: ['b', 'a', 'c'],
              properties: {
                a: { type: 'string' },
                b: { type: 'number' },
                c: { type: 'boolean' },
              },
            },
          },
        },
      },
    }

    expect(schema).toEqual(rootSchemaJson)
  })
})
