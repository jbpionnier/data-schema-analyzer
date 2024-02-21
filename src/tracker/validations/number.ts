import { NumberType } from '../../schema'
import { AnalyzeAndInpect, Namespace, PropertyValidationParams } from './'

const infoKeys: Array<keyof NumberType> = ['minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum']

type StatsValue = {
  count: number
  minimum?: number
  maximum?: number
  type: string
}

export function numberValidations({ schema, validations, analyze }: PropertyValidationParams<NumberType, number>): void {
  if (analyze instanceof AnalyzeAndInpect && analyze.infoValues) {
    const infosSchema = infoKeys.reduce<any>((acc, key) => {
      if (schema[key] != null) {
        acc[key] = schema[key]
      }
      return acc
    }, {})
    const statsValueByNamespace = new Map<Namespace, StatsValue>()

    validations.push((namespace, input) => {
      let statsValue = statsValueByNamespace.get(namespace)
      if (!statsValue) {
        statsValue = { count: 0, type: schema.type }
        statsValueByNamespace.set(namespace, statsValue)
      }
      statsValue.count++
      statsValue.minimum = statsValue.minimum == null || statsValue.minimum > input ? input : statsValue.minimum
      statsValue.maximum = statsValue.maximum == null || statsValue.maximum < input ? input : statsValue.maximum
    })

    analyze.inform(() => {
      return Array.from(statsValueByNamespace)
        .map(([namespace, statsValue]) => {
          return {
            property: namespace,
            stats: statsValue,
            infos: infosSchema,
          }
        })
    })
  }

  if (schema.type === 'integer') {
    validations.push((namespace, input) => {
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
    validations.push((namespace, input) => {
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
    validations.push((namespace, input) => {
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
    validations.push((namespace, input) => {
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
    validations.push((namespace, input) => {
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
