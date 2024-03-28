import { ArrayType } from '../../schema'
import { Analyze } from '../analyze'
import { Namespace, PropertyResult } from '../index'
import { getPropertyValidator } from './property'
import { getSchemaValidator } from './schema'
import { getInputType, isArrayType, TypeInt } from './schema-type'
import { ObjectValidations, ObjectValidator } from './validator'

export function getArrayValidator({ analyze, schema, required }: {
  analyze: Analyze
  schema: ArrayType
  required: boolean
}): ObjectValidator {
  analyze.objectValidatorCount++

  const itemsValidator = getSchemaValidator({
    analyze,
    schema: schema.items,
    required,
  })

  const validations: ObjectValidations = [
    getPropertyValidator({ analyze, schema, required }),

    (namespace: Namespace, input, inputType: TypeInt) => {
      if (!isArrayType(input, inputType)) { return [] }

      const propertiesResult: PropertyResult[] = []
      for (const value of input) {
        const valueType = getInputType(value)
        itemsValidator.validate(namespace, value, valueType, propertiesResult)
      }

      return propertiesResult
    },
  ]

  return new ObjectValidator(validations)
}
