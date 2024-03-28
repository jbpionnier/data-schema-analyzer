import { ObjectProperties, ObjectType } from '../../schema'
import { Analyze } from '../analyze'
import { Namespace, PropertyResult } from '../index'
import { getSchemaValidator } from './schema'
import { getInputType } from './schema-type'
import { ObjectValidations, ObjectValidator, Validator } from './validator'

export function getObjectValidator({ analyze, schema }: {
  analyze: Analyze
  schema: ObjectType
}): ObjectValidator {
  analyze.objectValidatorCount++
  const validators = getPropertiesValidator({ schema, analyze })

  const validations: ObjectValidations = [
    (namespace: Namespace, input) => {
      if (input == null) { return [] }

      const propertiesResult: PropertyResult[] = []
      validateProperties({ input, namespace, validators, propertiesResult })
      validateUnknownProperties({ input, namespace, properties: schema.properties, propertiesResult })
      return propertiesResult
    },
  ]
  return new ObjectValidator(validations)
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

function validateProperties({ namespace, validators, input, propertiesResult }: {
  namespace: Namespace
  validators: [string, Validator][]
  input: { [property: string]: {} }
  propertiesResult: PropertyResult[]
}): void {
  for (const [property, validator] of validators) {
    const fullNamespace = getNamespace(namespace, property)
    const propertyValue = input[property]
    const inputType = getInputType(propertyValue)
    validator.validate(fullNamespace, propertyValue, inputType, propertiesResult)
  }
}

function validateUnknownProperties({ namespace, properties, input, propertiesResult }: {
  namespace: Namespace
  properties: ObjectProperties
  input: { [property: string]: {} }
  propertiesResult: PropertyResult[]
}): void {
  const entries = Object.entries(input)
  for (const [property, example] of entries) {
    if (!properties[property]) {
      const fullNamespace = getNamespace(namespace, property)
      propertiesResult.push({
        property: fullNamespace,
        type: 'UNKNOWN',
        description: 'unknown property',
        example,
      })
    }
  }
}

function getNamespace(namespace: Namespace, property: string): Namespace {
  return (namespace ? namespace + '.' + property : property) as Namespace
}
