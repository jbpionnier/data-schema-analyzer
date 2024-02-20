import { NumberType } from '../../schema'
import { AnalyzeAndInpect, PropertyValidationParams } from './'

const infoKeys: Array<keyof NumberType> = ['minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum']

export function numberValidations({ namespace, schema, validations, analyze }: PropertyValidationParams<NumberType>): void {
  if (analyze instanceof AnalyzeAndInpect && analyze.infoValues) {
    const statsValue: { minimum?: number; maximum?: number } = {}
    validations.push((input: any) => {
      statsValue.minimum = statsValue.minimum == null || statsValue.minimum > input ? input : statsValue.minimum
      statsValue.maximum = statsValue.maximum == null || statsValue.maximum < input ? input : statsValue.maximum
    })

    analyze.inform(() => {
      const infos = infoKeys.reduce<any>((acc, key) => {
        if (schema[key] != null) {
          acc[key] = schema[key]
        }
        return acc
      }, {})

      return {
        property: namespace,
        stats: statsValue,
        infos,
      }
    })
  }

  if (schema.minimum != null) {
    validations.push((input: any) => {
      if (input <= schema.minimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property value is too low (<= ${schema.minimum})`,
          example: input,
        }
      }
    })
  }

  if (schema.exclusiveMinimum != null) {
    validations.push((input: any) => {
      if (input < schema.exclusiveMinimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property value is too low (< ${schema.exclusiveMinimum})`,
          example: input,
        }
      }
    })
  }

  if (schema.maximum != null) {
    validations.push((input: any) => {
      if (input >= schema.maximum!) {
        return {
          property: namespace,
          type: 'MAXIMUM',
          description: `property value is too high (>= ${schema.maximum})`,
          example: input,
        }
      }
    })
  }

  if (schema.exclusiveMaximum != null) {
    validations.push((input: any) => {
      if (input > schema.exclusiveMaximum!) {
        return {
          property: namespace,
          type: 'MAXIMUM',
          description: `property value is too high (> ${schema.exclusiveMaximum})`,
          example: input,
        }
      }
    })
  }

  if (schema.type === 'integer') {
    validations.push((input: any) => {
      if (!Number.isInteger(input)) {
        return {
          property: namespace,
          type: 'INTEGER',
          description: `property value is not integer`,
          example: input,
        }
      }
    })
  }
}
