import { ObjectProperties, ObjectType, Schema } from '../schema'
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
      .filter((result): result is PropertyResult => result && result.type !== 'OK')
  }
}

export function getSchemaValidator({ analyze, schema, required }: { analyze: Analyze<any>; schema: Schema; required: boolean }): ObjectValidator {
  analyze.objectValidatorCount++

  if ('properties' in schema) {
    return getObjectValidator({ analyze, schema })
  }

  // if (schema.type === 'object' && '$ref' in schema && schema.$ref) {
  //   const currentSchema = analyze.rootSchema.definitions[schema.$ref]
  //   if (currentSchema) {
  //     return getSchemaValidator({ schema: currentSchema, analyze })
  //   }
  // }

  const validator = getPropertyValidator({ schema, required, analyze })
  const validations: PropertiesValidation = [
    (namespace: Namespace, input): PropertyResult[] => {
      const inputResult = validator.validate(namespace, input)
      return inputResult ? [inputResult] : []
    },
  ]

  if ('items' in schema) {
    const validator = getSchemaValidator({
      analyze,
      schema: schema.items,
      required,
    })
    validations.push((namespace, input) => {
      if (!Array.isArray(input)) { return [] }
      return input.flatMap((value) => validator.validate(namespace, value))
    })
  }

  return new ObjectValidator(validations)
}

function getObjectValidator({ analyze, schema }: {
  analyze: Analyze
  schema: ObjectType
}): ObjectValidator {
  const validators = getObjectValidators({ schema, analyze })

  const validations: PropertiesValidation = [
    (namespace, input): PropertyResult[] => getObjectProperties({ input, namespace, validators }),
    (namespace, input): PropertyResult[] => getUnknownProperties({ input, namespace, properties: schema.properties }),
  ]
  return new ObjectValidator(validations)
}

function getObjectValidators({ schema, analyze }: {
  analyze: Analyze
  schema: ObjectType
}): [string, ObjectValidator][] {
  const { properties, required } = schema
  const requiredByProperty = (required || [])
    .reduce<{ [property: string]: true }>((acc, propertyName) => {
      acc[propertyName] = true
      return acc
    }, {})

  return Object.keys(properties)
    .map((propertyName): [string, ObjectValidator] => {
      const propertySchema = properties[propertyName]!
      const validator = getSchemaValidator({
        analyze,
        schema: propertySchema,
        required: requiredByProperty[propertyName],
      })
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
