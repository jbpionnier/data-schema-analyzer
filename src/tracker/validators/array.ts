import { ArrayType } from '../../schema'
import { PropertyResult, PropertyValidation } from '../index'

export function arrayValidators({ namespace, schema, validations }: {
  schema: ArrayType
  validations: PropertyValidation
  namespace: string
}): void {
  const resultOk: PropertyResult = { property: namespace, description: 'property ok', type: 'OK' }
  validations.push((input: any) => {
    const valueLength = (input as any[]).length
    if (valueLength == null) {
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
