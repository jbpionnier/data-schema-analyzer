import { AnalyzeAndInpect, EnumType, getInputType, Informer, Namespace, PropertyResult, PropertyValidationParams } from './index'

const STRING_OR_NUMBER = new Set<string>(['string', 'number'])

export function enumValidations({ schema, validator, analyze }: PropertyValidationParams<EnumType, string>): void {
  if (analyze instanceof AnalyzeAndInpect && !schema.ignoreUnusedValues && schema.enum?.[0] && STRING_OR_NUMBER.has(typeof schema.enum[0])) {
    const valuesUsedByNamespace = new Map<Namespace, Set<any>>()

    analyze.report(() => {
      return Array.from(valuesUsedByNamespace)
        .filter(([_namespace, valuesUsed]) => schema.enum.some((value) => !valuesUsed.has(value)))
        .map(([namespace, valuesUsed]): PropertyResult => {
          return {
            property: namespace,
            type: 'ENUM_VALUES',
            description: 'values used',
            example: Array.from(valuesUsed).sort().join("' | '"),
          }
        })
    })

    validator.add((namespace, input) => {
      const inputType = getInputType(input)
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

  validator.add((namespace, input) => {
    const inputType = getInputType(input)
    const isStringOrNumber = inputType === 'string' || inputType === 'number'
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

type StatsValue = {
  count: number
  enum: {
    [key: string]: number
  }
}

export function enumInformations({ schema, validator, analyze }: PropertyValidationParams<EnumType, string>): void {
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
        statsValue = { count: 0, enum: {} }
        statsValueByNamespace.set(namespace, statsValue)
      }
      statsValue.count++
      statsValue.enum[input] = (statsValue.enum[input] || 0) + 1
    })

    analyze.inform((): Informer[] => {
      return Array.from(statsValueByNamespace)
        .map(([namespace, statsValue]) => {
          return {
            property: namespace,
            type: schema.type,
            stats: statsValue,
            infos: infosSchema,
          }
        })
    })
  }
}
