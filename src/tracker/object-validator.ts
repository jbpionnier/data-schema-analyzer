import { ObjectProperties, Schema } from '../schema'
import { Namespace, PropertyResult, Reporters } from './'
import { AnalyzeId } from './analyze'
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

  static from({ analyzeId, namespace, schema, reporting }: {
    analyzeId: AnalyzeId
    namespace: Namespace
    reporting: Reporters | undefined
    schema: Schema & {
      validator?: ObjectValidator
    }
  }): ObjectValidator {
    if (!schema.validator || schema.validator.analyzeId !== analyzeId) {
      const validations = getObjectValidations({ analyzeId, namespace, schema, reporting })
      schema.validator = new ObjectValidator(analyzeId, validations)
    }

    return schema.validator
  }
}

function getObjectValidations({ analyzeId, namespace, schema, reporting }: {
  analyzeId: AnalyzeId
  namespace: Namespace
  schema: Schema
  reporting: Reporters | undefined
}): PropertiesValidation {
  const validations: PropertiesValidation = []

  if ('properties' in schema) {
    const validators: Array<[string, ObjectValidator]> = getObjectValidators({
      namespace,
      analyzeId,
      properties: schema.properties,
      reporting,
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

  const validator = PropertyValidator.from({ analyzeId, namespace, schema, reporting })
  validations.push((input: any): PropertyResult[] => {
    const inputResult = validator.validate(input)
    return inputResult ? [inputResult] : []
  })

  if ('items' in schema) {
    const validator = ObjectValidator.from({
      analyzeId,
      namespace,
      schema: schema.required ? { ...schema.items, required: true } : schema.items,
      reporting,
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

function getObjectValidators({ namespace, analyzeId, reporting, properties }: {
  namespace: Namespace
  analyzeId: AnalyzeId
  properties: ObjectProperties
  reporting: Reporters | undefined
}): Array<[string, ObjectValidator]> {
  const propertiesList = Object.keys(properties)
  return propertiesList
    .map((property): [string, ObjectValidator] => {
      const fullNamespace: Namespace = namespace ? `${namespace}.${property}` : property as Namespace
      const validator = ObjectValidator.from({
        analyzeId,
        schema: properties[property]!,
        namespace: fullNamespace,
        reporting,
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
