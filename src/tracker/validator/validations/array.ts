import { AnalyzeAndInpect, ArrayType, Informer, Namespace, PropertyResult, PropertyValidationParams } from './index'

export function arrayValidations({ schema, validator }: PropertyValidationParams<ArrayType, []>): void {
  const resultOk: PropertyResult = { property: '' as Namespace, description: 'property ok', type: 'OK' }
  validator.add((_namespace, input) => {
    if (!Array.isArray(input)) {
      return resultOk
    }
  })
  if (schema.minItems != null) {
    validator.add((namespace, input) => {
      if (input.length < schema.minItems!) {
        return {
          property: namespace,
          type: 'MIN_ITEMS',
          description: `array length is too short (${schema.minItems} minimum)`,
          example: input.length,
        }
      }
    })
  }
  if (schema.maxItems != null) {
    validator.add((namespace, input: []) => {
      if (input.length > schema.maxItems!) {
        return {
          property: namespace,
          type: 'MAX_ITEMS',
          description: `array length is too long (${schema.maxItems} maximum)`,
          example: input.length,
        }
      }
    })
  }
}

const infoKeys: Array<keyof ArrayType> = ['minItems', 'maxItems']

type StatsValue = {
  count: number
  empty: number
  notEmpty: number
  minItems?: number
  maxItems?: number
}

export function arrayInformations({ schema, validator, analyze }: PropertyValidationParams<ArrayType, object[]>): void {
  if (analyze instanceof AnalyzeAndInpect && analyze.infoValues) {
    const infosSchema = infoKeys.reduce<any>((acc, key) => {
      if (schema[key] != null) {
        acc[key] = schema[key]
      }
      return acc
    }, {})
    const statsValueByNamespace = new Map<Namespace, StatsValue>()

    validator.add((namespace, input) => {
      let statsValue = statsValueByNamespace.get(namespace)
      if (!statsValue) {
        statsValue = { count: 0, empty: 0, notEmpty: 0 }
        statsValueByNamespace.set(namespace, statsValue)
      }

      const arrayLength = input.length
      statsValue.count++
      statsValue.empty = statsValue.empty + (arrayLength === 0 ? 1 : 0)
      statsValue.notEmpty = statsValue.notEmpty + (arrayLength > 0 ? 1 : 0)
      statsValue.minItems = statsValue.minItems == null || statsValue.minItems > arrayLength ? arrayLength : statsValue.minItems
      statsValue.maxItems = statsValue.maxItems == null || statsValue.maxItems < arrayLength ? arrayLength : statsValue.maxItems
    })

    analyze.inform((): Informer[] => {
      return Array.from(statsValueByNamespace)
        .map(([namespace, { count, empty, notEmpty, minItems, maxItems }]: [Namespace, StatsValue]) => {
          const statsValueFormatted = {
            count,
            ...(empty > 0 ? { empty } : {}),
            ...(notEmpty > 0 ? { notEmpty } : {}),
            ...(minItems === maxItems ? { items: minItems } : { minItems, maxItems }),
          }
          return {
            property: namespace,
            type: schema.type,
            stats: statsValueFormatted,
            infos: infosSchema,
          }
        })
    })
  }
}
