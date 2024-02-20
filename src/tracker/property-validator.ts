import { Schema } from '../schema'
import { Analyze, Namespace, PropertyResult } from './'
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

  static from({ namespace, schema, analyze }: {
    namespace: Namespace
    schema: Schema & {
      validator?: PropertyValidator
    }
    analyze: Analyze
  }): PropertyValidator {
    if (!schema.validator || schema.validator.analyzeId !== analyze.id) {
      const validations = getPropertyValidation({ namespace, schema, analyze })
      schema.validator = new PropertyValidator(analyze.id, namespace, validations)
    }
    return schema.validator
  }
}

function getPropertyValidation({ namespace, schema, analyze }: {
  namespace: Namespace
  schema: Schema
  analyze: Analyze
}): PropertyValidation {
  const validations: PropertyValidation = []
  requiredValidations({ namespace, schema, validations, analyze })
  optionalValidations({ namespace, schema, validations, analyze })
  notNullValidations({ namespace, schema, validations, analyze })
  singleValueValidations({ namespace, schema, validations, analyze })
  typeValidations({ namespace, schema, validations, analyze })
  return validations
}
