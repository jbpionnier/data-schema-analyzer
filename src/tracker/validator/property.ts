import { Schema } from '../../schema'
import { Analyze } from '../analyze'
import { PropertyValidationParams } from './validations'
import { notNullValidations, optionalInformations, requiredValidations, singleValueInformations, typeValidations } from './validations/property'
import { Validator } from './validator'

export function getPropertyValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: Schema
  required: boolean
}): Validator {
  analyze.propertyValidatorCount++
  const validator = new Validator([], { abortEarly: true })
  const params: PropertyValidationParams = { analyze, schema, required, validator }
  requiredValidations(params)
  optionalInformations(params)
  notNullValidations(params)
  singleValueInformations(params)
  typeValidations(params)
  return validator
}
