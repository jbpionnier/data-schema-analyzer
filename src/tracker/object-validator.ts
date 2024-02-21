import { ObjectProperties, Schema } from '../schema'
import { Namespace, PropertyResult } from './'
import { Analyze } from './analyze'
import { getPropertyValidator } from './property-validator'

type PropertiesValidation = Array<(namespace: Namespace, input: any) => PropertyResult[]>

export class ObjectValidator {
  constructor(
    private readonly validations: PropertiesValidation,
  ) {}

  validate(namespace: Namespace, input: any): PropertyResult[] {
    return this.validations
      .flatMap((validation) => validation(namespace, input) || [])
      .filter((result) => result.type !== 'OK')
  }
}

export function getSchemaValidator({ schema, analyze }: { schema: Schema; analyze: Analyze<any> }): ObjectValidator {
  analyze.objectValidatorCount++

  if ('properties' in schema) {
    return getObjectValidator({ analyze, properties: schema.properties })
  }

  const validations: PropertiesValidation = []
  const validator = getPropertyValidator({ schema, analyze })
  validations.push((namespace, input): PropertyResult[] => {
    const inputResult = validator.validate(namespace, input)
    return inputResult ? [inputResult] : []
  })

  if ('items' in schema) {
    const validator = getSchemaValidator({
      analyze,
      schema: schema.required ? { ...schema.items, required: true } : schema.items,
    })
    validations.push((namespace, input) => {
      if (!Array.isArray(input)) { return [] }
      return input.flatMap((value) => validator.validate(namespace, value))
    })
  }

  return new ObjectValidator(validations)
}

function getObjectValidator({ properties, analyze }: {
  analyze: Analyze
  properties: ObjectProperties
}): ObjectValidator {
  const validators = getObjectValidators({ properties, analyze })

  const validations: PropertiesValidation = [
    (namespace, input): PropertyResult[] => getObjectProperties({ input, namespace, validators }),
    (namespace, input): PropertyResult[] => getUnknownProperties({ input, namespace, properties }),
  ]
  return new ObjectValidator(validations)
}

function getObjectValidators({ properties, analyze }: {
  analyze: Analyze
  properties: ObjectProperties
}): [string, ObjectValidator][] {
  return Object.keys(properties)
    .map((propertyName): [string, ObjectValidator] => {
      const schema = properties[propertyName]!
      const validator = getSchemaValidator({ analyze, schema })
      return [propertyName, validator]
    })
}

function getObjectProperties({ namespace, validators, input }: {
  namespace: Namespace
  validators: [string, ObjectValidator][]
  input: any | undefined
}): PropertyResult[] {
  if (input == null) { return [] }

  return validators
    .flatMap(([property, validator]) => {
      const fullNamespace: Namespace = namespace ? `${namespace}.${property}` : property as Namespace
      return validator.validate(fullNamespace, input[property])
    })
}

function getUnknownProperties({ namespace, properties, input }: {
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
