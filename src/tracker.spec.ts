import { SchemaGenerator, Tracker } from './'
import { getIdentifierPropertyName, ObjectType, Schema } from './schema'
import { PropertyResult, TrackReport } from './types'

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
  list: Array<{
    tag: string
  }>
}

describe('Tracker', () => {
  describe('track', () => {
    it('should return required and unknown warning for property', () => {
      const track = createTracker<{ name: string }>({
        name: { type: 'string', required: true },
      })

      expect(track({ other: true } as any)).toEqual([
        { property: 'name', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
        { property: 'other', type: 'UNKNOWN', description: 'unknown property', example: true },
      ])
    })

    it('should return required and unknown warning for nested property', () => {
      const track = createTracker<{ list: { tag: string }[] }>({
        list: {
          required: true,
          type: 'array',
          items: { type: 'object', properties: { tag: { type: 'string', required: true } } },
        },
      })

      expect(track({ list: [{ tags: 'foo' }] } as any)).toEqual([
        { property: 'list.tag', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
        { property: 'list.tags', type: 'UNKNOWN', description: 'unknown property', example: 'foo' },
      ])
    })

    it('should return no warning without id property', () => {
      const track = createTracker<{ id: number }>({
        id: { type: 'number', required: true },
      })

      expect(track({ id: 1 })).toEqual([])
      expect(track({ id: 1 })).toEqual([])
    })

    it('should return already tracked warning with id property', () => {
      const track = createTracker<{ id: number }>({
        id: { type: 'number', id: true, required: true },
      }, { summaryResult: true })

      expect(track({ id: 1 })).toEqual([])
      expect(track({ id: 2 })).toEqual([])

      expect(track({ id: 1 })).toEqual([
        { property: 'id', type: 'ALREADY_TRACKED', description: 'input already tracked' },
      ])

      expect(track({ id: 1 })).toEqual([])
    })

    it('should return min/max length and pattern warning for string property', () => {
      const track = createTracker<{ name: string }>({
        name: { type: 'string', minLength: 4, maxLength: 8, pattern: '^\\w+$' },
      })

      expect(track({ name: 'foo' })).toEqual([
        { property: 'name', type: 'MIN_LENGTH', description: 'property length is too short (4 minimum)', example: '"foo" (3)' },
      ])
      expect(track({ name: 'Jean Kevin' })).toEqual([
        { property: 'name', type: 'MAX_LENGTH', description: 'property length is too long (8 maximum)', example: '"Jean Kevin" (10)' },
      ])
      expect(track({ name: 'foo bar' })).toEqual([
        { property: 'name', type: 'PATTERN', description: 'property value not match pattern ^\\w+$', example: 'foo bar' },
      ])
      expect(track({ name: 35 } as any)).toEqual([
        { property: 'name', type: 'TYPE', description: 'property type is not string', example: '35' },
      ])
    })

    it('should return min/max warning for number property', () => {
      const track = createTracker<{ age: number }>({
        age: { type: 'number', minimum: 0, maximum: 99 },
      })

      expect(track({ age: -1 })).toEqual([
        { property: 'age', type: 'MINIMUM', description: 'property value is too low (0 minimum)', example: -1 },
      ])
      expect(track({ age: 200 })).toEqual([
        { property: 'age', type: 'MAXIMUM', description: 'property value is too high (99 maximum)', example: 200 },
      ])
      expect(track({ age: '35' } as any)).toEqual([
        { property: 'age', type: 'TYPE', description: 'property type is not number', example: '"35"' },
      ])
    })

    it('should return unknown value warning for enum property', () => {
      const track = createTracker<{ gender: 'MAN' | 'WOMAN' }>({
        gender: { type: 'enum', values: ['MAN', 'WOMAN'] },
      })

      expect(track({ gender: 'OTHER' } as any)).toEqual([
        { property: 'gender', type: 'ENUM_UNKNOWN', description: 'property value not in enum values [MAN, WOMAN]', example: 'OTHER' },
      ])
    })

    it('should return min/max length warning for array property', () => {
      const track = createTracker<{ list: string[] }>({
        list: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
      })

      expect(track({ list: [] })).toEqual([
        { property: 'list', type: 'MIN_ITEMS', description: 'array length is too short (1 minimum)', example: 0 },
      ])
      expect(track({ list: ['foo', 'bar', 'baz'] })).toEqual([
        { property: 'list', type: 'MAX_ITEMS', description: 'array length is too long (2 maximum)', example: 3 },
      ])
      expect(track({ list: [1] } as any)).toEqual([
        { property: 'list', type: 'TYPE', description: 'property type is not string', example: '1' },
      ])
    })

    it('should return not required warning for nested object in array property', () => {
      const nestedSchema: ObjectType = { type: 'object', properties: { id: { type: 'number', required: true } } }
      const track = createTracker<{ list: Array<{ id: number }> }>({
        list: { type: 'array', items: nestedSchema },
      })

      expect(track({ list: [] })).toEqual([])
      expect(track({ list: [{ id: 123 }] })).toEqual([])
      expect(track({ list: [{ foo: 'bar' } as any] })).toEqual([
        { property: 'list.id', type: 'REQUIRED', description: 'required property is missing', example: '[number]' },
        { property: 'list.foo', type: 'UNKNOWN', description: 'unknown property', example: 'bar' },
      ])
    })
  })

  describe('analyze', () => {
    const successReport: TrackReport = { success: true, properties: [] }
    let tracker: Tracker<SimpleType>

    beforeAll(() => {
      const generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.spec.json' })
      const schema = generator.generate({
        sourceFiles: ['src/tracker.spec.ts'],
        rootInterfaceName: 'SimpleType',
      })
      tracker = new Tracker<SimpleType>({ schema })
    })

    beforeEach(() => {
      tracker.analyzeStart({ inspectData: true })
    })

    it('should return always present', async () => {
      const report = await tracker
        .trackAsync({
          name: 'Kevin',
          age: 35,
          firstName: 'Jean',
          info: { gender: 'MAN' },
          list: [],
        })
      expect(report).toEqual(successReport)

      expect(tracker
        .track({
          name: 'Jean',
          firstName: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = await tracker.analyzeEndAsync()
      expect(result)
        .toEqual({
          success: false,
          properties: [{
            type: 'ALWAYS_PRESENT',
            property: 'firstName',
            description: 'optional property always present',
          }],
        })
    })

    it('should return always present with nested object', async () => {
      const report = await tracker
        .trackAsync({
          name: 'Kevin',
          age: 35,
          firstName: 'Jean',
          info: { gender: 'MAN' },
          list: [{ tag: 'foo' }],
        })
      expect(report).toEqual(successReport)

      expect(tracker
        .track({
          name: 'Jean',
          firstName: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [{ tag: 'bar' }],
        }))
        .toEqual(successReport)

      const result = await tracker.analyzeEndAsync()
      expect(result)
        .toEqual({
          success: false,
          properties: [{
            type: 'ALWAYS_PRESENT',
            property: 'firstName',
            description: 'optional property always present',
          }],
        })
    })

    it('should return never used', () => {
      expect(tracker
        .track({
          name: 'Jean',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(tracker
        .track({
          name: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = tracker.analyzeEnd()
      expect(result)
        .toEqual({
          success: false,
          properties: [{
            type: 'NEVER_USED',
            property: 'firstName',
            description: 'optional property never used',
          }],
        })
    })

    it('should return single value', () => {
      expect(tracker
        .track({
          name: 'Kevin',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(tracker
        .track({
          name: 'Kevin',
          firstName: 'Jean',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = tracker.analyzeEnd()
      expect(result)
        .toEqual({
          success: false,
          properties: [{
            type: 'SINGLE_VALUE',
            property: 'name',
            example: 'Kevin',
            description: 'property always have the same single value',
          }],
        })
    })

    it('should return enum values used', () => {
      expect(tracker
        .track({
          name: 'Jean',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(tracker
        .track({
          name: 'Kevin',
          firstName: 'Kevin',
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = tracker.analyzeEnd()
      expect(result)
        .toEqual({
          success: false,
          properties: [{
            type: 'SINGLE_VALUE',
            property: 'info.gender',
            description: 'property always have the same single value',
            example: 'MAN',
          }, {
            type: 'ENUM_VALUES',
            property: 'info.gender',
            description: 'values used',
            example: 'MAN',
          }],
        })
    })
  })
})

function createTracker<T extends { [key: string]: any }>(
  properties: { [property: string]: Schema },
  options: { summaryResult?: true } = {},
): (input: T) => PropertyResult[] {
  const tracker = new Tracker<T>({
    schema: { type: 'object', identifierProperty: getIdentifierPropertyName({ properties } as any), properties } as any,
    ...options,
  })

  return (input: T) => {
    const report = tracker.track(input)
    return report.properties
  }
}
