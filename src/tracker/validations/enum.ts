import { EnumType } from '../../schema'
import { getInputType, PropertyValidationParams } from './'

export function enumValidations({ namespace, schema, validations, reporting }: PropertyValidationParams<EnumType>): void {
  if (!schema.ignoreUnusedValues && reporting) {
    const valuesUsed = new Set<any>()

    reporting.push(() => {
      if (schema.values.some((value) => !valuesUsed.has(value))) {
        return {
          property: namespace,
          type: 'ENUM_VALUES',
          description: 'values used',
          example: Array.from(valuesUsed).sort().join("' | '"),
        }
      }
    })

    validations.push((input: any) => {
      const inputType = getInputType(input)
      const isStringOrNumber = inputType === 'string' || inputType === 'number'
      if (isStringOrNumber) {
        valuesUsed.add(input)
      }
    })
  }

  validations.push((input: any) => {
    const inputType = getInputType(input)
    const isStringOrNumber = inputType === 'string' || inputType === 'number'
    if (isStringOrNumber && !schema.values.includes(input as any)) {
      return {
        property: namespace,
        type: 'ENUM_UNKNOWN',
        description: `property value not in enum values [${schema.values.join(', ')}]`,
        example: input,
      }
    }
  })
}
