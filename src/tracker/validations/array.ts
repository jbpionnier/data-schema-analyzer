import { ArrayType } from '../../schema'
import { Namespace, PropertyResult, PropertyValidationParams } from './'

export function arrayValidations({ schema, validations }: PropertyValidationParams<ArrayType, []>): void {
  const resultOk: PropertyResult = { property: '' as Namespace, description: 'property ok', type: 'OK' }
  validations.push((_namespace, input) => {
    if (!Array.isArray(input)) {
      return resultOk
    }
  })
  if (schema.minItems != null) {
    validations.push((namespace, input) => {
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
    validations.push((namespace, input: []) => {
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
