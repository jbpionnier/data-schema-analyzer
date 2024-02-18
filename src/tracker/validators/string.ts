import { StringType } from '../../schema'
import { PropertyValidation } from '../index'

export function stringValidators({ namespace, schema, validations }: {
  schema: StringType
  validations: PropertyValidation
  namespace: string
}): void {
  if (schema.minLength != null) {
    validations.push((input: any) => {
      const valueLength = input?.toString().length
      if (valueLength < schema.minLength!) {
        return {
          property: namespace,
          type: 'MIN_LENGTH',
          description: `property length is too short (${schema.minLength} minimum)`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.maxLength != null) {
    validations.push((input: any) => {
      const valueLength = input?.toString().length
      if (valueLength > schema.maxLength!) {
        return {
          property: namespace,
          type: 'MAX_LENGTH',
          description: `property length is too long (${schema.maxLength} maximum)`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.pattern && schema.type === 'string') {
    const patternRegExp = new RegExp(schema.pattern)
    validations.push((input: any) => {
      if (!patternRegExp!.test(input)) {
        return {
          property: namespace,
          type: 'PATTERN',
          description: `property format is invalid`,
          example: input,
        }
      }
    })
  }
}
