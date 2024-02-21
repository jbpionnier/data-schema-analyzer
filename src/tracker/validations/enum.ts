import { EnumType } from '../../schema'
import { AnalyzeAndInpect, getInputType, PropertyValidationParams } from './'

const STRING_OR_NUMBER = new Set<string>(['string', 'number'])

export function enumValidations({ namespace, schema, validations, analyze }: PropertyValidationParams<EnumType>): void {
  if (analyze instanceof AnalyzeAndInpect && !schema.ignoreUnusedValues && schema.values?.[0] && STRING_OR_NUMBER.has(typeof schema.values[0])) {
    const valuesUsed = new Set<any>()

    analyze.report(() => {
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
      const isStringOrNumber = STRING_OR_NUMBER.has(inputType)
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
