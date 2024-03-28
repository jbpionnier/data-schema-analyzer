import { EnumType, getInputType, getSchemaKeys, Informer, Namespace, PropertyInformationParams, PropertyResult, PropertyValidationParams,
  StatsEnumValue, TypeInt } from './index'

const STRING_OR_NUMBER = new Set<TypeInt>([TypeInt.STRING, TypeInt.NUMBER])

export function enumValidations({ schema, validator }: PropertyValidationParams<EnumType, string>): void {
  validator.add((namespace, input, inputType) => {
    const isStringOrNumber = STRING_OR_NUMBER.has(inputType)
    if (isStringOrNumber && !schema.enum.includes(input)) {
      return {
        property: namespace,
        type: 'ENUM_UNKNOWN',
        description: `property value not in enum values [${schema.enum.join(', ')}]`,
        example: input,
      }
    }
  })
}

const infoKeys: Array<keyof EnumType> = ['ignoreUnusedValues']

export function enumInformations({ schema, validator, analyze }: PropertyInformationParams<EnumType, string>): void {
  if (!schema.ignoreUnusedValues && schema.enum?.[0] && STRING_OR_NUMBER.has(getInputType(schema.enum[0]))) {
    const valuesUsedByNamespace = new Map<Namespace, Set<unknown>>()

    analyze.report((propertiesResult: PropertyResult[]) => {
      for (const [namespace, valuesUsed] of valuesUsedByNamespace) {
        if (schema.enum.some((value) => !valuesUsed.has(value))) {
          propertiesResult.push({
            property: namespace,
            type: 'ENUM_VALUES',
            description: 'values used',
            example: Array.from(valuesUsed).sort().join("' | '"),
          })
        }
      }
    })

    validator.add((namespace, input, inputType) => {
      const isStringOrNumber = STRING_OR_NUMBER.has(inputType)
      if (isStringOrNumber) {
        let valuesUsed = valuesUsedByNamespace.get(namespace)
        if (!valuesUsed) {
          valuesUsed = new Set()
          valuesUsedByNamespace.set(namespace, valuesUsed)
        }
        valuesUsed.add(input)
      }
    })
  }

  if (analyze.infoValues) {
    const infosSchema = getSchemaKeys(schema, infoKeys)
    const statsValueByNamespace = new Map<Namespace, StatsEnumValue>()

    validator.add((namespace, input) => {
      let statsValue = statsValueByNamespace.get(namespace)
      if (!statsValue) {
        statsValue = { count: 0, enum: {} }
        statsValueByNamespace.set(namespace, statsValue)
      }
      statsValue.count++
      statsValue.enum[input] = (statsValue.enum[input] || 0) + 1
    })

    analyze.inform((informers: Informer[]): void => {
      for (const [namespace, statsValue] of statsValueByNamespace) {
        informers.push({
          property: namespace,
          type: schema.type,
          stats: statsValue,
          infos: infosSchema,
        })
      }
    })
  }
}
