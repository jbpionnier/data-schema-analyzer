import { Schema } from '../schema'
import { Analyze, Namespace, PropertyResult } from './'
import { PropertyValidationParams } from './validations'
import { notNullValidations, optionalValidations, requiredValidations, singleValueValidations, typeValidations } from './validations/property'

export type PropertyValidation<I = any> = Array<(namespace: Namespace, input: I) => PropertyResult | undefined | void>

export class PropertyValidator {
  constructor(
    private readonly validations: PropertyValidation,
  ) {}

  validate(namespace: Namespace, input: any): PropertyResult | undefined {
    for (const validation of this.validations) {
      const result = validation(namespace, input)
      if (result) {
        return result
      }
    }
  }
}

export function getPropertyValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: Schema
  required: boolean
}): PropertyValidator {
  const validations: PropertyValidation = []
  const params: PropertyValidationParams<Schema> = { analyze, schema, required, validations }
  requiredValidations(params)
  optionalValidations(params)
  notNullValidations(params)
  singleValueValidations(params)
  typeValidations(params)
  analyze.propertyValidatorCount++
  return new PropertyValidator(validations)
}
