import { Schema } from '../schema'
import { Analyze, Namespace, PropertyResult } from './'
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

export function getPropertyValidator({ schema, analyze }: {
  schema: Schema
  analyze: Analyze
}): PropertyValidator {
  const validations: PropertyValidation = []
  requiredValidations({ schema, validations, analyze })
  optionalValidations({ schema, validations, analyze })
  notNullValidations({ schema, validations, analyze })
  singleValueValidations({ schema, validations, analyze })
  typeValidations({ schema, validations, analyze })
  analyze.propertyValidatorCount++
  return new PropertyValidator(validations)
}
