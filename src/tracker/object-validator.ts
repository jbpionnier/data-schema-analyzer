import { ObjectProperties, Schema } from '../schema'
import { Namespace, PropertyResult } from './'
import { Analyze, AnalyzeId } from './analyze'
import { PropertyValidator } from './property-validator'

export type PropertiesValidation = Array<(input: any) => PropertyResult[] | undefined | void>

export class ObjectValidator {
  private constructor(
    readonly analyzeId: AnalyzeId,
    private readonly validations: PropertiesValidation,
  ) {}

  validate(input: any): PropertyResult[] {
    return this.validations
      .flatMap((validation) => validation(input) || [])
      .filter((result) => result.type !== 'OK')
  }

  static from({ namespace, schema, analyze }: {
    namespace: Namespace
    schema: Schema & {
      validator?: ObjectValidator
    }
    analyze: Analyze<any>
  }): ObjectValidator {
    if (!schema.validator || schema.validator.analyzeId !== analyze.id) {
      const validations = getObjectValidations({ namespace, schema, analyze })
      schema.validator = new ObjectValidator(analyze.id, validations)
    }

    return schema.validator
  }
}

function getObjectValidations({ namespace, schema, analyze }: {
  namespace: Namespace
  schema: Schema
  analyze: Analyze
}): PropertiesValidation {
  const validations: PropertiesValidation = []

  if ('properties' in schema) {
    const validators: Array<[string, ObjectValidator]> = getObjectValidators({
      namespace,
      properties: schema.properties,
      analyze,
    })

    validations.push((input: any): PropertyResult[] => {
      if (input == null) { return [] }

      return validators
        .flatMap(([property, validator]) => validator.validate(input[property]))
    })

    validations.push((input: any): PropertyResult[] => {
      return getUnknownProperties({
        namespace,
        properties: schema.properties,
        input,
      })
    })
    return validations
  }

  const validator = PropertyValidator.from({ namespace, schema, analyze })
  validations.push((input: any): PropertyResult[] => {
    const inputResult = validator.validate(input)
    return inputResult ? [inputResult] : []
  })

  if ('items' in schema) {
    const validator = ObjectValidator.from({
      analyze,
      namespace,
      schema: schema.required ? { ...schema.items, required: true } : schema.items,
    })
    validations.push((input: any) => {
      if (Array.isArray(input)) {
        return input.flatMap((value: any) => validator.validate(value))
      }
    })
    return validations
  }

  return validations
}

function getObjectValidators({ namespace, properties, analyze }: {
  namespace: Namespace
  analyze: Analyze
  properties: ObjectProperties
}): Array<[string, ObjectValidator]> {
  const propertiesList = Object.keys(properties)
  return propertiesList
    .map((property): [string, ObjectValidator] => {
      const fullNamespace: Namespace = namespace ? `${namespace}.${property}` : property as Namespace
      const validator = ObjectValidator.from({
        analyze,
        schema: properties[property]!,
        namespace: fullNamespace,
      })
      return [property, validator]
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
