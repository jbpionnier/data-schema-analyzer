import { SchemaGenerator, Tracker } from '../'
import { ObjectType, Schema } from '../schema'
import { PropertyResult, TrackReport } from './'
import { Analyze } from './analyze'

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
    it('should return required warning for property', () => {
      const track = createTracker<{ name: string }>({
        name: { type: 'string' },
      }, {
        required: ['name'],
      })

      expect(track({} as any)).toEqual([
        { property: 'name', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
      ])
    })
    it('should return required and unknown warning for property', () => {
      const track = createTracker<{ name: string }>({
        name: { type: 'string' },
      }, {
        required: ['name'],
      })

      expect(track({ other: true } as any)).toEqual([
        { property: 'name', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
        { property: 'other', type: 'UNKNOWN', description: 'unknown property', example: true },
      ])
    })

    it('should return required and unknown warning for nested property', () => {
      const track = createTracker<{ list: { tag: string }[] }>({
        list: {
          type: 'array',
          items: {
            type: 'object',
            required: ['tag'],
            properties: { tag: { type: 'string' } },
          },
        },
      }, {
        required: ['list'],
      })

      expect(track({ list: [{ tags: 'foo' }] } as any)).toEqual([
        { property: 'list.tag', type: 'REQUIRED', description: 'required property is missing', example: '[string]' },
        { property: 'list.tags', type: 'UNKNOWN', description: 'unknown property', example: 'foo' },
      ])
    })

    it('should return no warning without id property', () => {
      const track = createTracker<{ id: number }>({
        id: { type: 'number' },
      }, {
        required: ['id'],
      })

      expect(track({ id: 1 })).toEqual([])
      expect(track({ id: 1 })).toEqual([])
    })

    it('should return already tracked warning with id property summary', () => {
      const track = createTracker<{ id: number }>({
        id: { type: 'number', id: true },
      }, {
        summaryResult: true,
        required: ['id'],
      })

      expect(track({ id: 1 })).toEqual([])
      expect(track({ id: 2 })).toEqual([])

      expect(track({ id: 1 })).toEqual([
        { property: 'id', type: 'ALREADY_TRACKED', description: 'input already tracked' },
      ])

      expect(track({ id: 1 })).toEqual([])
    })
    it('should return already tracked warning with id property', () => {
      const track = createTracker<{ id: number }>({
        id: { type: 'number', id: true },
      }, {
        required: ['id'],
      })

      expect(track({ id: 1 })).toEqual([])
      expect(track({ id: 2 })).toEqual([])

      expect(track({ id: 1 })).toEqual([
        { property: 'id', type: 'ALREADY_TRACKED', description: 'input already tracked' },
      ])
      expect(track({ id: 1 })).toEqual([
        { property: 'id', type: 'ALREADY_TRACKED', description: 'input already tracked' },
      ])
    })

    it('should return min/max length and pattern warning for string property', () => {
      const track = createTracker<{ name: string }>({
        name: { type: 'string', minLength: 4, maxLength: 8, pattern: '^\\w+$' },
      })

      expect(track({ name: 'foo' })).toEqual([
        { property: 'name', type: 'MIN_LENGTH', description: 'property must have at least 4 characters', example: '"foo" (3)' },
      ])
      expect(track({ name: 'Jean Kevin' })).toEqual([
        { property: 'name', type: 'MAX_LENGTH', description: 'property must not be greater than 8 characters', example: '"Jean Kevin" (10)' },
      ])
      expect(track({ name: 'foo bar' })).toEqual([
        { property: 'name', type: 'PATTERN', description: 'property format is invalid', example: 'foo bar' },
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
        { property: 'age', type: 'MINIMUM', description: 'property must be at least 0', example: -1 },
      ])
      expect(track({ age: 0 })).toEqual([])

      expect(track({ age: 99 })).toEqual([])
      expect(track({ age: 100 })).toEqual([
        { property: 'age', type: 'MAXIMUM', description: 'property must not be greater than 99', example: 100 },
      ])
      expect(track({ age: '35' } as any)).toEqual([
        { property: 'age', type: 'TYPE', description: 'property type is not number', example: '"35"' },
      ])
    })

    it('should return min/max exclusive warning for number property', () => {
      const track = createTracker<{ age: number }>({
        age: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 99 },
      })

      expect(track({ age: 0 })).toEqual([
        { property: 'age', type: 'MINIMUM', description: 'property must be at least or equal to 0', example: 0 },
      ])
      expect(track({ age: 1 })).toEqual([])

      expect(track({ age: 98 })).toEqual([])
      expect(track({ age: 99 })).toEqual([
        { property: 'age', type: 'MAXIMUM', description: 'property must not be greater or equal than 99', example: 99 },
      ])
    })

    it('should return integer warning for integer property', () => {
      const track = createTracker<{ age: number }>({
        age: { type: 'integer' },
      })
      expect(track({ age: 10 })).toEqual([])

      expect(track({ age: 1.2 })).toEqual([
        { property: 'age', type: 'INTEGER', description: 'property must be a integer', example: 1.2 },
      ])
    })

    it('should return unknown value warning for enum property', () => {
      const track = createTracker<{ gender: 'MAN' | 'WOMAN' }>({
        gender: { type: 'string', enum: ['MAN', 'WOMAN'] },
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
      const nestedSchema: ObjectType = {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' } },
      }
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
    let generator: SchemaGenerator
    let analyze: Analyze<SimpleType>
    let tracker: Tracker<SimpleType>

    beforeAll(() => {
      generator = new SchemaGenerator({ tsConfigFilePath: './tsconfig.spec.json' })
      const schema = generator.generate({
        sourceFiles: ['src/tracker/tracker.spec.ts'],
        rootInterfaceName: 'SimpleType',
      })
      tracker = new Tracker<SimpleType>({ schema })
    })

    beforeEach(() => {
      analyze = tracker.analyze()
    })

    it('should return always present', async () => {
      const report = await analyze
        .trackAsync({
          name: 'Kevin',
          age: 35,
          firstName: 'Jean',
          info: { gender: 'MAN' },
          list: [],
        })
      expect(report).toEqual(successReport)

      expect(analyze
        .track({
          name: 'Jean',
          firstName: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = analyze.end()
      expect(result.success).toEqual(false)
      expect(result.properties)
        .toEqual([{
          type: 'ALWAYS_PRESENT',
          property: 'firstName',
          description: 'optional property always present',
        }])
    })

    it('should return always present with nested object', async () => {
      const report = await analyze
        .trackAsync({
          name: 'Kevin',
          age: 35,
          firstName: 'Jean',
          info: { gender: 'MAN' },
          list: [{ tag: 'foo' }],
        })
      expect(report).toEqual(successReport)

      expect(analyze
        .track({
          name: 'Jean',
          firstName: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [{ tag: 'bar' }],
        }))
        .toEqual(successReport)

      const result = analyze.end()
      expect(result.success).toEqual(false)
      expect(result.properties)
        .toEqual([{
          type: 'ALWAYS_PRESENT',
          property: 'firstName',
          description: 'optional property always present',
        }])
    })

    it('should return never used', () => {
      expect(analyze
        .track({
          name: 'Jean',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(analyze
        .track({
          name: 'Kevin',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = analyze.end()
      expect(result.success).toBe(false)
      expect(result.properties)
        .toEqual([{
          type: 'NEVER_USED',
          property: 'firstName',
          description: 'optional property never used',
        }])
    })

    it('should return single value', () => {
      expect(analyze
        .track({
          name: 'Kevin',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(analyze
        .track({
          name: 'Kevin',
          firstName: 'Jean',
          info: { gender: 'WOMAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = analyze.end()
      expect(result.success).toBe(false)
      expect(result.properties)
        .toEqual([{
          type: 'SINGLE_VALUE',
          property: 'name',
          example: 'Kevin',
          description: 'property always have the same single value',
        }])
    })

    it('should return enum values used', () => {
      expect(analyze
        .track({
          name: 'Jean',
          age: 35,
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      expect(analyze
        .track({
          name: 'Kevin',
          firstName: 'Kevin',
          info: { gender: 'MAN' },
          list: [],
        }))
        .toEqual(successReport)

      const result = analyze.end()
      expect(result.success).toBe(false)
      expect(result.properties)
        .toEqual([{
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

function createTracker<T extends { [key: string]: any }>(
  properties: { [property: string]: Schema },
  options: { summaryResult?: true; required?: string[] } = {},
): (input: T) => PropertyResult[] {
  const tracker = new Tracker<T>({
    schema: {
      $ref: 'SimpleType',
      definitions: {
        SimpleType: {
          type: 'object',
          required: options.required || [],
          properties,
        },
      },
    },
    summaryResult: options.summaryResult,
  })

  const analyze = tracker.analyze()

  return (input: T) => {
    const report = analyze.track(input)
    return report.properties
  }
}
