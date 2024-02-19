import { NumberType } from '../../schema'
import { PropertyValidationParams } from './'

export function numberValidations({ namespace, schema, validations }: PropertyValidationParams<NumberType>): void {
  if (schema.minimum != null && schema.type === 'number') {
    validations.push((input: any) => {
      if (input < schema.minimum!) {
        return {
          property: namespace,
          type: 'MINIMUM',
          description: `property value is too low (${schema.minimum} minimum)`,
          example: input,
        }
      }
    })
  }
  if (schema.maximum != null && schema.type === 'number') {
    validations.push((input: any) => {
      if (input > schema.maximum!) {
        return {
          property: namespace,
          type: 'MAXIMUM',
          description: `property value is too high (${schema.maximum} maximum)`,
          example: input,
        }
      }
    })
  }
}
