import { NumberType } from '../../schema'
import { PropertyValidationParams } from './'

export function numberValidations({ namespace, schema, validations }: PropertyValidationParams<NumberType>): void {
  if (schema.minimum != null) {
    validations.push((input: any) => {
      if (input <= schema.minimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property value is too low (${schema.minimum} minimum)`,
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
          description: `property value is too low (${schema.exclusiveMinimum} minimum)`,
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
          description: `property value is too high (${schema.maximum} maximum)`,
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
          description: `property value is too high (${schema.exclusiveMaximum} maximum)`,
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
