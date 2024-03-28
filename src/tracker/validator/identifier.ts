import { ObjectType, StringType } from '../../schema'
import { Namespace, PropertyResult } from '../index'
import { PropertyValidations, PropertyValidator } from './validator'

export function getIdentifierValidator({ schema, identifierPropertyName, name }: {
  schema: ObjectType
  identifierPropertyName: Namespace
  name: string
}): PropertyValidator {
  const property = schema?.properties?.[identifierPropertyName] as StringType
  if (!property) {
    throw new Error(`${name}.${identifierPropertyName} property must be required`)
  }

  if (property.type !== 'string' && property.type !== 'number') {
    throw new Error(`${name}.${identifierPropertyName} property must be a string or a number`)
  }

  const trackedIds = new Set<string>()
  const identifierProperty = { name: identifierPropertyName, ...property }

  const validations: PropertyValidations = [
    (_namespace: Namespace, input: any): PropertyResult | undefined => {
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

  return new PropertyValidator(validations)
}
