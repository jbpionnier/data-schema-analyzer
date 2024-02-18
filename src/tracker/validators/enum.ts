import { EnumType } from '../../schema'
import { getInputType, PropertyValidation, Reporters } from '../index'

export function enumValidators({ namespace, schema, validations, reporting }: {
  schema: EnumType
  validations: PropertyValidation
  reporting: Reporters | undefined
  namespace: string
}): void {
  if (!schema.ignoreUnusedValues && reporting) {
    const valuesUsed = new Set<string | number>()

    reporting.push(() => {
      if (schema.values.some((value) => !valuesUsed.has(value.toString()))) {
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
