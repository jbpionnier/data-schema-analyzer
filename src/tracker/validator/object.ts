import { ObjectProperties, ObjectType } from '../../schema'
import { Analyze } from '../analyze'
import { Namespace, PropertyResult } from '../index'
import { getSchemaValidator } from './schema'
import { PropertiesValidation, Validator } from './validator'

export function getObjectValidator({ analyze, schema }: {
  analyze: Analyze
  schema: ObjectType
}): Validator {
  const validators = getPropertiesValidator({ schema, analyze })

  const validations: PropertiesValidation = [
    (namespace: Namespace, input): PropertyResult[] => validateProperties({ input, namespace, validators }),
    (namespace: Namespace, input): PropertyResult[] => validateUnknownProperties({ input, namespace, properties: schema.properties }),
  ]
  return new Validator(validations)
}

function getPropertiesValidator({ schema, analyze }: {
  analyze: Analyze
  schema: ObjectType
}): [string, Validator][] {
  const { properties, required } = schema
  const requiredByProperty = (required || [])
    .reduce<{ [property: string]: true }>((acc, propertyName) => {
      acc[propertyName] = true
      return acc
    }, {})

  return Object.entries(properties)
    .map(([propertyName, propertySchema]): [string, Validator] => {
      const validator = getSchemaValidator({
        analyze,
        schema: propertySchema,
        required: requiredByProperty[propertyName],
      })
      return [propertyName, validator]
    })
}

function validateProperties({ namespace, validators, input }: {
  namespace: Namespace
  validators: [string, Validator][]
  input: any | undefined
}): PropertyResult[] {
  if (input == null) { return [] }

  return validators
    .flatMap(([property, validator]) => {
      const fullNamespace: Namespace = namespace ? `${namespace}.${property}` : property as Namespace
      return validator.validate(fullNamespace, input[property])
    })
}

function validateUnknownProperties({ namespace, properties, input }: {
  namespace: Namespace
  properties: ObjectProperties
  input: any | undefined
}): PropertyResult[] {
  if (input == null) { return [] }

  return Object.keys(input)
    .filter((property) => !properties[property])
    .map((property) => {
      const fullNamespace: Namespace = namespace ? `${namespace}.${property}` : property as Namespace
      return {
        property: fullNamespace,
        type: 'UNKNOWN',
        description: 'unknown property',
        example: input[property],
      }
    })
}
