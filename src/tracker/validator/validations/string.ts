import { checkSchemaType, getSchemaKeys, Informer, Namespace, PropertyInformationParams, PropertyValidationParams, StatsStringValue, StringType,
  TypeInt } from './index'

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
  if (schema.pattern && checkSchemaType(schema, TypeInt.STRING)) {
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
  const infosSchema = getSchemaKeys(schema, infoKeys)
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

  analyze.inform((informers: Informer[]) => {
    for (const [namespace, { count, empty, notEmpty, minLength, maxLength }] of statsValueByNamespace) {
      const statsValueFormatted = {
        count,
        ...(empty > 0 ? { empty } : {}),
        ...(notEmpty > 0 ? { notEmpty } : {}),
        ...(minLength === maxLength ? { length: minLength } : { minLength, maxLength }),
      }
      informers.push({
        property: namespace,
        type: schema.type,
        stats: statsValueFormatted,
        infos: infosSchema,
      })
    }
  })
}
