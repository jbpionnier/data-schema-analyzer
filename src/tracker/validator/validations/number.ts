import { Informer, Namespace, NumberType, PropertyInformationParams, PropertyValidationParams, StatsNumberValue } from './index'

export function numberValidations({ schema, validator }: PropertyValidationParams<NumberType, number>): void {
  if (schema.type === 'integer') {
    validator.add((namespace, input) => {
      if (!Number.isInteger(input)) {
        return {
          property: namespace,
          type: 'INTEGER',
          description: `property must be a integer`,
          example: input,
        }
      }
    })
  }

  if (schema.minimum != null) {
    validator.add((namespace, input) => {
      if (input < schema.minimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property must be at least ${schema.minimum}`,
          example: input,
        }
      }
    })
  }

  if (schema.exclusiveMinimum != null) {
    validator.add((namespace, input) => {
      if (input <= schema.exclusiveMinimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property must be at least or equal to ${schema.exclusiveMinimum}`,
          example: input,
        }
      }
    })
  }

  if (schema.maximum != null) {
    validator.add((namespace, input) => {
      if (input > schema.maximum!) {
        return {
          property: namespace,
          type: 'MAXIMUM',
          description: `property must not be greater than ${schema.maximum}`,
          example: input,
        }
      }
    })
  }

  if (schema.exclusiveMaximum != null) {
    validator.add((namespace, input) => {
      if (input >= schema.exclusiveMaximum!) {
        return {
          property: namespace,
          type: 'MAXIMUM',
          description: `property must not be greater or equal than ${schema.exclusiveMaximum}`,
          example: input,
        }
      }
    })
  }
}

const infoKeys: Array<keyof NumberType> = ['minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum']

export function numberInformations({ schema, validator, analyze }: PropertyInformationParams<NumberType, number>): void {
  if (!analyze.infoValues) {
    return
  }

  const infosSchema = infoKeys.reduce<any>((acc, key) => {
    if (schema[key] != null) {
      acc[key] = schema[key]
    }
    return acc
  }, {})
  const statsValueByNamespace = new Map<Namespace, StatsNumberValue>()

  validator.add((namespace, input) => {
    let statsValue = statsValueByNamespace.get(namespace)
    if (!statsValue) {
      statsValue = { count: 0 }
      statsValueByNamespace.set(namespace, statsValue)
    }
    statsValue.count++
    statsValue.minimum = statsValue.minimum == null || statsValue.minimum > input ? input : statsValue.minimum
    statsValue.maximum = statsValue.maximum == null || statsValue.maximum < input ? input : statsValue.maximum
  })

  analyze.inform((): Informer[] => {
    return Array.from(statsValueByNamespace)
      .map(([namespace, statsValue]): Informer => {
        return {
          property: namespace,
          type: schema.type,
          stats: statsValue,
          infos: infosSchema,
        }
      })
  })
}
