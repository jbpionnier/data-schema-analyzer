import { Schema } from '../schema'
import { Namespace, PropertyResult, Reporters } from './'
import { AnalyzeId } from './analyze'
import { notNullValidations, optionalValidations, requiredValidations, singleValueValidations, typeValidations } from './validations/property'

export type PropertyValidation = Array<(input: any) => PropertyResult | undefined | void>

export class PropertyValidator {
  constructor(
    readonly analyzeId: AnalyzeId,
    readonly name: Namespace,
    private readonly validations: PropertyValidation,
  ) {}

  validate(input: any): PropertyResult | undefined {
    for (const validation of this.validations) {
      const result = validation(input)
      if (result) {
        return result
      }
    }
  }

  static from({ analyzeId, namespace, schema, reporting }: {
    analyzeId: AnalyzeId
    namespace: Namespace
    schema: Schema & {
      validator?: PropertyValidator
    }
    reporting: Reporters | undefined
  }): PropertyValidator {
    if (!schema.validator || schema.validator.analyzeId !== analyzeId) {
      const validations = getPropertyValidation({ namespace, schema, reporting })
      schema.validator = new PropertyValidator(analyzeId, namespace, validations)
    }
    return schema.validator
  }
}

function getPropertyValidation({ namespace, schema, reporting }: {
  namespace: Namespace
  schema: Schema
  reporting: Reporters | undefined
}): PropertyValidation {
  const validations: PropertyValidation = []
  requiredValidations({ namespace, schema, validations, reporting })
  optionalValidations({ namespace, schema, validations, reporting })
  notNullValidations({ namespace, schema, validations, reporting })
  singleValueValidations({ namespace, schema, validations, reporting })
  typeValidations({ namespace, schema, validations, reporting })
  return validations
}
