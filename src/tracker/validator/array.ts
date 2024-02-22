import { ArrayType } from '../../schema'
import { Analyze } from '../analyze'
import { getPropertyValidator } from './property'
import { getSchemaValidator } from './schema'
import { PropertiesValidation, Validator } from './validator'

export function getArrayValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: ArrayType
  required: boolean
}): Validator {
  const validator = getSchemaValidator({
    analyze,
    schema: schema.items,
    required,
  })
  const validations: PropertiesValidation = [
    getPropertyValidator({ schema, required, analyze }),
  ]
  validations.push((namespace, input) => {
    if (!Array.isArray(input)) { return [] }
    return input.flatMap((value) => validator.validate(namespace, value))
  })
  return new Validator(validations)
}
