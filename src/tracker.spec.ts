import { ObjectType, Schema } from './schema'
import { SchemaGenerator } from './schema-generator'
import { Tracker } from './tracker'

type SimpleType = {
  /**
   * @minLength 1
   * @maxLength 5
   */
  name: string
  /**
   * @pattern ^\w+$
   */
  firstName?: string
  /**
   * @minimum 1
   * @maximum 99
   */
  age?: number
  info: {
    gender: 'MAN' | 'WOMAN'
  }
}

describe('Tracker', () => {
  let schema: Schema & ObjectType

  beforeAll(() => {
    const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.json' })
    schema = generator.generate({
      fileNameOrPath: 'src/tracker.spec.ts',
      typeName: 'SimpleType',
    })
  })

  describe('analyzeProperties', () => {
    it('should analyze properties', () => {
      expect(schema.properties).toEqual({
        name: { name: 'name', type: 'string', required: true, minLength: 1, maxLength: 5 },
        age: { name: 'age', type: 'number', minimum: 1, maximum: 99 },
        firstName: { name: 'firstName', type: 'string', pattern: '^\\w+$' },
        info: {
          name: 'info',
          type: 'object',
          required: true,
          properties: {
            gender: {
              name: 'gender',
              type: 'enum',
              required: true,
              values: ['MAN', 'WOMAN'],
            },
          },
        },
      })

      const input: any = {
        newProp: 'hello',
        firstName: 'Jean Kevin',
        age: '35',
        info: {
          gender: 'OTHER',
        },
      }

      const tracker = new Tracker<SimpleType>({ schema, summaryResult: true })
      const badProperties = tracker.analyzeProperties(input)
      expect(badProperties).toEqual([
        { property: 'name', type: 'REQUIRED', example: '[string]' },
        { property: 'firstName', type: 'PATTERN', example: '"Jean Kevin" not match /^\\w+$/' },
        { property: 'age', type: 'TYPE', example: '"35"' },
        { property: 'info.gender', type: 'ENUM_UNKNOWN', example: 'OTHER' },
        { property: 'newProp', type: 'UNKNOWN', example: 'hello' },
      ])
      // | 'MIN_ITEMS'
      // | 'MAX_ITEMS'
      const badProperties2 = tracker.analyzeProperties({ ...input, name: '', age: -1 })
      expect(badProperties2).toEqual([
        { property: 'name', type: 'MIN_LENGTH', example: ' (0 < 1)' },
        { property: 'age', type: 'MINIMUM', example: '-1 < 1' },
      ])

      const badProperties3 = tracker.analyzeProperties({ ...input, name: 'Jean Kevin', age: 200 })
      expect(badProperties3).toEqual([
        { property: 'name', type: 'MAX_LENGTH', example: 'Jean Kevin (10 > 5)' },
        { property: 'age', type: 'MAXIMUM', example: '200 > 99' },
      ])
    })
  })

  describe('summarizeProperties', () => {
    let tracker: Tracker<SimpleType>

    beforeAll(() => {
      tracker = new Tracker<SimpleType>({ schema })
    })

    beforeEach(() => {
      tracker.initialize({ inspectData: true })
    })

    it('should return always present', () => {
      expect(tracker.analyzeProperties({
        name: 'Kevin',
        age: 35,
        firstName: 'Jean',
        info: { gender: 'MAN' },
      })).toEqual([])

      expect(tracker.analyzeProperties({
        name: 'Jean',
        firstName: 'Kevin',
        info: { gender: 'WOMAN' },
      })).toEqual([])

      const result = tracker.summarizeProperties()
      expect(result).toEqual([{
        type: 'ALWAYS_PRESENT',
        property: 'firstName',
        description: 'optional property always present',
      }])
    })

    it('should return never used', () => {
      expect(tracker.analyzeProperties({
        name: 'Jean',
        age: 35,
        info: { gender: 'MAN' },
      })).toEqual([])

      expect(tracker.analyzeProperties({
        name: 'Kevin',
        info: { gender: 'WOMAN' },
      })).toEqual([])

      const result = tracker.summarizeProperties()
      expect(result).toEqual([{
        type: 'NEVER_USED',
        property: 'firstName',
        description: 'optional property never used',
      }])
    })

    it('should return single value', () => {
      expect(tracker.analyzeProperties({
        name: 'Kevin',
        age: 35,
        info: { gender: 'MAN' },
      })).toEqual([])

      expect(tracker.analyzeProperties({
        name: 'Kevin',
        firstName: 'Jean',
        info: { gender: 'WOMAN' },
      })).toEqual([])

      const result = tracker.summarizeProperties()
      expect(result).toEqual([{
        type: 'SINGLE_VALUE',
        property: 'name',
        example: 'Kevin',
        description: 'property always have the same single value',
      }])
    })

    it('should return enum values used', () => {
      expect(tracker.analyzeProperties({
        name: 'Jean',
        age: 35,
        info: { gender: 'MAN' },
      })).toEqual([])

      expect(tracker.analyzeProperties({
        name: 'Kevin',
        firstName: 'Kevin',
        info: { gender: 'MAN' },
      })).toEqual([])

      const result = tracker.summarizeProperties()
      expect(result).toEqual([{
        type: 'SINGLE_VALUE',
        property: 'info.gender',
        description: 'property always have the same single value',
        example: 'MAN',
      }, {
        type: 'ENUM_VALUES',
        property: 'info.gender',
        description: 'values used',
        example: 'MAN',
      }])
    })
  })
})
