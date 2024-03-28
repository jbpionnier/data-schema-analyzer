import { checkSchemaType, getSchemaKeys, Informer, Namespace, NumberType, PropertyInformationParams, PropertyValidationParams, StatsNumberValue,
  TypeInt } from './index'

export function numberValidations({ schema, validator }: PropertyValidationParams<NumberType, number>): void {
  if (checkSchemaType(schema, TypeInt.INTEGER)) {
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
  const infosSchema = getSchemaKeys(schema, infoKeys)
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
