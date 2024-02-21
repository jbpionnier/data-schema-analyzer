import { StringType } from '../../schema'
import { PropertyValidationParams } from './'

export function stringValidations({ schema, validations }: PropertyValidationParams<StringType>): void {
  if (schema.minLength != null) {
    validations.push((namespace, input) => {
      const valueLength = input.toString().length
      if (valueLength < schema.minLength!) {
        return {
          property: namespace,
          type: 'MIN_LENGTH',
          description: `property must have at least ${schema.minLength} characters`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.maxLength != null) {
    validations.push((namespace, input) => {
      const valueLength = input.toString().length
      if (valueLength > schema.maxLength!) {
        return {
          property: namespace,
          type: 'MAX_LENGTH',
          description: `property must not be greater than ${schema.maxLength} characters`,
          example: `"${input}" (${valueLength})`,
        }
      }
    })
  }
  if (schema.pattern && schema.type === 'string') {
    const patternRegExp = new RegExp(schema.pattern)
    validations.push((namespace, input) => {
      if (!patternRegExp.test(input)) {
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
