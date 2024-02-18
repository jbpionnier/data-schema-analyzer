import { NumberType } from '../../schema'
import { PropertyValidation } from '../index'

export function numberValidators({ namespace, schema, validations }: {
  schema: NumberType
  validations: PropertyValidation
  namespace: string
}): void {
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
