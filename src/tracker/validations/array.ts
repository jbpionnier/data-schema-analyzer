import { ArrayType } from '../../schema'
import { PropertyResult, PropertyValidationParams } from './'

export function arrayValidations({ namespace, schema, validations }: PropertyValidationParams<ArrayType>): void {
  const resultOk: PropertyResult = { property: namespace, description: 'property ok', type: 'OK' }
  validations.push((input: any) => {
    if (!Array.isArray(input)) {
      return resultOk
    }
  })
  if (schema.minItems != null) {
    validations.push((input: any[]) => {
      if (input.length < schema.minItems!) {
        return {
          property: namespace,
          type: 'MIN_ITEMS',
          description: `array length is too short (${schema.minItems} minimum)`,
          example: input.length,
        }
      }
    })
  }
  if (schema.maxItems != null) {
    validations.push((input: any[]) => {
      if (input.length > schema.maxItems!) {
        return {
          property: namespace,
          type: 'MAX_ITEMS',
          description: `array length is too long (${schema.maxItems} maximum)`,
          example: input.length,
        }
      }
    })
  }
}
