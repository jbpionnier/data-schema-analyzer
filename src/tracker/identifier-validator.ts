import { RootSchema } from '../schema'
import { AnalyzeId } from './analyze'
import { Namespace, PropertyResult } from './index'
import { PropertyValidation, PropertyValidator } from './property-validator'

export function getIdentifierValidator({ schema, identifierPropertyName, analyzeId }: {
  analyzeId: AnalyzeId
  identifierPropertyName: Namespace
  schema: RootSchema
}): PropertyValidator {
  const property = schema.properties[identifierPropertyName]
  if (!property?.required) {
    throw new Error(`${schema.name}.${identifierPropertyName} property must be required`)
  }

  if (property.type !== 'string' && property.type !== 'number') {
    throw new Error(`${schema.name}.${identifierPropertyName} property must be a string or a number`)
  }

  const trackedIds = new Set<string>()
  const identifierProperty = { name: identifierPropertyName, ...property }

  const validations: PropertyValidation = [
    (input: any): PropertyResult | undefined => {
      const inputId = input?.[identifierPropertyName]
      if (inputId == null || identifierProperty?.multiple) {
        return undefined
      }
      if (trackedIds.has(inputId)) {
        return {
          property: identifierProperty.name,
          type: 'ALREADY_TRACKED',
          description: 'input already tracked',
        }
      }
      trackedIds.add(inputId)
    },
  ]

  return new PropertyValidator(analyzeId, identifierPropertyName, validations)
}
