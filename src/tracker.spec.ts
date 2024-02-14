import { Schema } from './schema'
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
  describe('analyzeProperties', () => {
    it('should return required/unknown warning for property', () => {
      const tracker = createTracker<{ name: string }>({
        name: { type: 'string', required: true },
      })

      expect(tracker.analyzeProperties({ other: true } as any)).toEqual([
        { property: 'name', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
        { property: 'other', type: 'UNKNOWN', description: 'unknown property', example: true },
      ])
    })

    it('should return min/max length and pattern warning for string property', () => {
      const tracker = createTracker<{ name: string }>({
        name: { type: 'string', minLength: 4, maxLength: 8, pattern: '^\\w+$' },
      })

      expect(tracker.analyzeProperties({ name: 'foo' })).toEqual([
        { property: 'name', type: 'MIN_LENGTH', description: 'property length is too short (4 minimum)', example: '"foo" (3)' },
      ])
      expect(tracker.analyzeProperties({ name: 'Jean Kevin' })).toEqual([
        { property: 'name', type: 'MAX_LENGTH', description: 'property length is too long (8 maximum)', example: '"Jean Kevin" (10)' },
      ])
      expect(tracker.analyzeProperties({ name: 'foo bar' })).toEqual([
        { property: 'name', type: 'PATTERN', description: 'property value not match pattern /^\\w+$/', example: 'foo bar' },
      ])
      expect(tracker.analyzeProperties({ name: 35 } as any)).toEqual([
        { property: 'name', type: 'TYPE', description: 'property type is not string', example: '35' },
      ])
    })

    it('should return min/max warning for number property', () => {
      const tracker = createTracker<{ age: number }>({
        age: { type: 'number', minimum: 0, maximum: 99 },
      })

      expect(tracker.analyzeProperties({ age: -1 })).toEqual([
        { property: 'age', type: 'MINIMUM', description: 'property value is too low (0 minimum)', example: -1 },
      ])
      expect(tracker.analyzeProperties({ age: 200 })).toEqual([
        { property: 'age', type: 'MAXIMUM', description: 'property value is too high (99 maximum)', example: 200 },
      ])
      expect(tracker.analyzeProperties({ age: '35' } as any)).toEqual([
        { property: 'age', type: 'TYPE', description: 'property type is not number', example: '"35"' },
      ])
    })

    it('should return unknown value warning for enum property', () => {
      const tracker = createTracker<{ gender: 'MAN' | 'WOMAN' }>({
        gender: { type: 'enum', values: ['MAN', 'WOMAN'] },
      })

      expect(tracker.analyzeProperties({ gender: 'OTHER' } as any)).toEqual([
        { property: 'gender', type: 'ENUM_UNKNOWN', description: 'property value not in enum values [MAN, WOMAN]', example: 'OTHER' },
      ])
    })

    it('should return min/max length warning for array property', () => {
      const tracker = createTracker<{ list: string[] }>({
        list: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
      })

      expect(tracker.analyzeProperties({ list: [] })).toEqual([
        { property: 'list', type: 'MIN_ITEMS', description: 'array length is too short (1 minimum)', example: 0 },
      ])
      expect(tracker.analyzeProperties({ list: ['foo', 'bar', 'baz'] })).toEqual([
        { property: 'list', type: 'MAX_ITEMS', description: 'array length is too long (2 maximum)', example: 3 },
      ])
      expect(tracker.analyzeProperties({ list: [1] } as any)).toEqual([
        { property: 'list', type: 'TYPE', description: 'property type is not string', example: '1' },
      ])
    })
  })

  describe('summarizeProperties', () => {
    let tracker: Tracker<SimpleType>

    beforeAll(() => {
      const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.spec.json' })
      const schema = generator.generate({
        fileNameOrPath: 'src/tracker.spec.ts',
        rootInterfaceName: 'SimpleType',
      })
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

function createTracker<T extends { [key: string]: any }>(properties: { [property: string]: Schema }): Tracker<T> {
  return new Tracker<T>({
    schema: { properties },
  } as any)
}
