import { AnalyzeAndInpect, Informer, Namespace, PropertyInformationParams, PropertyValidationParams, StatsStringValue, StringType } from './index'

export function stringValidations({ schema, validator }: PropertyValidationParams<StringType>): void {
  if (schema.minLength != null) {
    validator.add((namespace, input) => {
      const valueLength = input.toString().length
      if (valueLength < schema.minLength!) {
        return {
          property: namespace,
          type: 'MIN_LENGTH',
          description: `property must have at least ${schema.minLength} characters`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.maxLength != null) {
    validator.add((namespace, input) => {
      const valueLength = input.toString().length
      if (valueLength > schema.maxLength!) {
        return {
          property: namespace,
          type: 'MAX_LENGTH',
          description: `property must not be greater than ${schema.maxLength} characters`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.pattern && schema.type === 'string') {
    const patternRegExp = new RegExp(schema.pattern)
    validator.add((namespace, input) => {
      if (!patternRegExp.test(input)) {
        return {
          property: namespace,
          type: 'PATTERN',
          description: `property format is invalid`,
          example: input,
        }
      }
    })
  }
}

const infoKeys: Array<keyof StringType> = ['minLength', 'maxLength', 'pattern']

export function stringInformations({ schema, validator, analyze, required }: PropertyInformationParams<StringType, string>): void {
  if (analyze instanceof AnalyzeAndInpect && analyze.infoValues) {
    const infosSchema = infoKeys.reduce<any>((acc, key) => {
      if (schema[key] != null) {
        acc[key] = schema[key]
      }
      return acc
    }, {})
    const statsValueByNamespace = new Map<Namespace, StatsStringValue>()

    validator.add((namespace, input) => {
      let statsValue = statsValueByNamespace.get(namespace)
      if (!statsValue) {
        statsValue = { count: 0, empty: 0, notEmpty: 0 }
        statsValueByNamespace.set(namespace, statsValue)
      }
      const valueLength = input.toString().length
      statsValue.count++
      if (!required) {
        statsValue.empty = statsValue.empty + (valueLength === 0 ? 1 : 0)
        statsValue.notEmpty = statsValue.notEmpty + (valueLength > 0 ? 1 : 0)
      }
      statsValue.minLength = statsValue.minLength == null || statsValue.minLength > valueLength ? valueLength : statsValue.minLength
      statsValue.maxLength = statsValue.maxLength == null || statsValue.maxLength < valueLength ? valueLength : statsValue.maxLength
    })

    analyze.inform((): Informer[] => {
      return Array.from(statsValueByNamespace)
        .map(([namespace, { count, empty, notEmpty, minLength, maxLength }]: [Namespace, StatsStringValue]): Informer => {
          const statsValueFormatted = {
            count,
            ...(empty > 0 ? { empty } : {}),
            ...(notEmpty > 0 ? { notEmpty } : {}),
            ...(minLength === maxLength ? { length: minLength } : { minLength, maxLength }),
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
