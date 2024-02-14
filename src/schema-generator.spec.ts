import { SchemaGenerator } from './schema-generator'

// @ts-expect-error
type StubType = {
  /**
   * @id
   * @minLength 1
   * @maxLength 3
   */
  myString: string
  myNumber?: number
  myBoolean?: boolean
  myObject?: object
  myAny?: object
  // myNull: null
  myEnumString: 'ping' | 'pong'
  myEnumNumber: 1 | 2 | 3
  mySubType: {
    subProp?: string
    /**
     * @minimum 18
     */
    age: number
  }
  myListString: string[]
  /**
   * @minItems 1
   * @maxItems 5
   */
  myListNumber: number[]
  myListObject?: object[]
  myListEnumString: Array<'ping' | 'pong'>
  myListEnumNumber?: Array<1 | 2 | 3>
  myList: Array<{
    /**
     * @minLength 1
     */
    subProp: string
  }>
  mySubTypeByRef?: StubSubType
  mySubTypeByRefList: StubSubType[]
  combineObject: { a?: string; b: number } & { a: string; c: boolean }
}
type StubSubType = {
  /**
   * @minimum 1
   */
  age: number
  shareability: 'NOTSHARED'
}

describe('Schema Generator', () => {
  it('should generate schema', () => {
    const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.json' })
    const schema = generator.generate({
      fileNameOrPath: 'src/schema-generator.spec.ts',
      typeName: 'StubType',
    })

    expect(schema.properties).toEqual({
      myString: { name: 'myString', minLength: 1, maxLength: 3, id: true, required: true, type: 'string' },
      myNumber: { name: 'myNumber', type: 'number' },
      myBoolean: { name: 'myBoolean', type: 'boolean' },
      myObject: { name: 'myObject', type: 'object' },
      // myNull: { name: 'myNull', required: true, type: 'null' },
      myAny: { name: 'myAny', type: 'object' },
      myEnumString: { name: 'myEnumString', required: true, type: 'enum', values: ['ping', 'pong'] },
      myEnumNumber: { name: 'myEnumNumber', required: true, type: 'enum', values: ['1', '2', '3'] },
      mySubType: {
        name: 'mySubType',
        type: 'object',
        required: true,
        properties: {
          age: { name: 'age', minimum: 18, required: true, type: 'number' },
          subProp: { name: 'subProp', type: 'string' },
        },
      },
      myListString: { name: 'myListString', required: true, type: 'array', items: { type: 'string' } },
      myListNumber: { name: 'myListNumber', minItems: 1, maxItems: 5, required: true, type: 'array', items: { type: 'number' } },
      myListObject: { name: 'myListObject', type: 'array', items: { type: 'object' } },
      myListEnumString: { name: 'myListEnumString', required: true, type: 'array', items: { type: 'enum', values: ['ping', 'pong'] } },
      myListEnumNumber: { name: 'myListEnumNumber', type: 'array', items: { type: 'enum', values: ['1', '2', '3'] } },
      myList: {
        name: 'myList',
        required: true,
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subProp: { name: 'subProp', minLength: 1, required: true, type: 'string' },
          },
        },
      },
      mySubTypeByRef: {
        name: 'mySubTypeByRef',
        type: 'object',
        properties: {
          age: { name: 'age', minimum: 1, required: true, type: 'number' },
          shareability: { name: 'shareability', required: true, type: 'enum', values: ['NOTSHARED'] },
        },
      },
      mySubTypeByRefList: {
        name: 'mySubTypeByRefList',
        required: true,
        type: 'array',
        items: {
          type: 'object',
          properties: {
            age: { name: 'age', minimum: 1, required: true, type: 'number' },
            shareability: { name: 'shareability', required: true, type: 'enum', values: ['NOTSHARED'] },
          },
        },
      },
      combineObject: {
        name: 'combineObject',
        type: 'object',
        required: true,
        properties: {
          a: { name: 'a', type: 'string', required: true },
          b: { name: 'b', type: 'number', required: true },
          c: { name: 'c', type: 'boolean', required: true },
        },
      },
    })
  })
})
