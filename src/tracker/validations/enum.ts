import { EnumType } from '../../schema'
import { AnalyzeAndInpect, getInputType, Namespace, PropertyResult, PropertyValidationParams } from './'

const STRING_OR_NUMBER = new Set<string>(['string', 'number'])

export function enumValidations({ schema, validations, analyze }: PropertyValidationParams<EnumType, string>): void {
  if (analyze instanceof AnalyzeAndInpect && !schema.ignoreUnusedValues && schema.enum?.[0] && STRING_OR_NUMBER.has(typeof schema.enum[0])) {
    const valuesUsedByNamespace = new Map<Namespace, Set<any>>()

    analyze.report(() => {
      return Array.from(valuesUsedByNamespace)
        .filter(([_namespace, valuesUsed]) => schema.enum.some((value) => !valuesUsed.has(value)))
        .map(([namespace, valuesUsed]): PropertyResult => {
          return {
            property: namespace,
            type: 'ENUM_VALUES',
            description: 'values used',
            example: Array.from(valuesUsed).sort().join("' | '"),
          }
        })
    })

    validations.push((namespace, input) => {
      const inputType = getInputType(input)
      const isStringOrNumber = STRING_OR_NUMBER.has(inputType)
      if (isStringOrNumber) {
        let valuesUsed = valuesUsedByNamespace.get(namespace)
        if (!valuesUsed) {
          valuesUsed = new Set()
          valuesUsedByNamespace.set(namespace, valuesUsed)
        }
        valuesUsed.add(input)
      }
    })
  }

  validations.push((namespace, input) => {
    const inputType = getInputType(input)
    const isStringOrNumber = inputType === 'string' || inputType === 'number'
    if (isStringOrNumber && !schema.enum.includes(input)) {
      return {
        property: namespace,
        type: 'ENUM_UNKNOWN',
        description: `property value not in enum values [${schema.enum.join(', ')}]`,
        example: input,
      }
    }
  })
}
