import { ArrayType } from '../../schema'
import { Analyze } from '../analyze'
import { getPropertyValidator } from './property'
import { getSchemaValidator } from './schema'
import { Validator } from './validator'

export function getArrayValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: ArrayType
  required: boolean
}): Validator {
  const itemsValidator = getSchemaValidator({
    analyze,
    schema: schema.items,
    required,
  })

  const arrayValidator = new Validator([
    getPropertyValidator({ analyze, schema, required }),
  ])
  arrayValidator.add((namespace, input) => {
    if (!Array.isArray(input)) { return [] }
    return input.flatMap((value) => itemsValidator.validate(namespace, value))
  })

  return arrayValidator
}
