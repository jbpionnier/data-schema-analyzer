import { Schema } from '../../schema'
import { Analyze, AnalyzeAndInpect } from '../analyze'
import { PropertyValidationParams } from './validations'
import { notNullValidations, optionalInformations, requiredValidations, singleValueInformations, typeValidations } from './validations/property'
import { Validator } from './validator'

export function getPropertyValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: Schema
  required: boolean
}): Validator {
  analyze.propertyValidatorCount++
  const analyzeInspect = analyze instanceof AnalyzeAndInpect
  const validator = new Validator([], { abortEarly: true })
  const params: PropertyValidationParams = { analyze, schema, required, validator }
  requiredValidations(params)
  analyzeInspect && optionalInformations({ analyze, schema, required, validator })
  notNullValidations(params)
  analyzeInspect && singleValueInformations({ analyze, schema, required, validator })
  typeValidations(params)
  return validator
}
