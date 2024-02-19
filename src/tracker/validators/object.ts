import { RootSchema, Schema } from '../../schema'
import { getInputType, PropertiesValidation, PropertyValidation, Reporters } from '../index'
import { PropertyValidator } from '../validator'
import { arrayValidators } from './array'
import { enumValidators } from './enum'
import { numberValidators } from './number'
import { stringValidators } from './string'

export function objectValidators({ namespace, schema, validations, reporting }: {
  namespace: string
  schema: Schema
  validations: PropertiesValidation
  reporting: Reporters | undefined
}): void {
  const validator = getPropertyValidator({ namespace, schema, reporting })
  validations.push((input: any) => {
    const inputResult = validator.validate(input)
    return inputResult ? [inputResult] : []
  })
}

function getPropertyValidator({ namespace, schema, reporting }: {
  namespace: string
  schema: Schema & {
    validator?: PropertyValidator
  }
  reporting: Reporters | undefined
}): PropertyValidator {
  if (!schema.validator) {
    const validations = getPropertyValidation({ namespace, schema, reporting })
    schema.validator = new PropertyValidator(validations)
  }
  return schema.validator
}

function getPropertyValidation({ namespace, schema, reporting }: {
  namespace: string
  schema: Schema
  reporting: Reporters | undefined
}): PropertyValidation {
  const validations: PropertyValidation = []

  if (!['enum', 'object'].includes(schema.type)) {
    validations.push((input: any) => {
      const inputType = getInputType(input)
      if (inputType !== schema.type) {
        return {
          property: namespace,
          type: 'TYPE',
          description: `property type is not ${schema.type}`,
          example: JSON.stringify(input),
        }
      }
    })
  }

  switch (schema.type) {
    case 'string': {
      stringValidators({ namespace, schema, validations })
      break
    }
    case 'number': {
      numberValidators({ namespace, schema, validations })
      break
    }
    case 'enum': {
      enumValidators({ namespace, schema, validations, reporting })
      break
    }
    case 'array': {
      arrayValidators({ namespace, schema, validations })
      break
    }
    default: {
      const typeName = Array.isArray(schema)
        ? `[${schema.map(({ type }) => type).join(' | ')}]`
        : schema.type
      if (!['boolean', 'object'].includes(typeName)) {
        validations.push((input: any) => {
          return {
            property: namespace,
            type: 'UNKNOWN_TYPE',
            description: `unknown type ${typeName}`,
            example: input,
          }
        })
      }
    }
  }

  return validations
}

export function getIdentifierValidator(identifierPropertyName: string, schema: RootSchema): PropertyValidator {
  const property = schema.properties[identifierPropertyName]
  if (!property?.required) {
    throw new Error(`${schema.name}.${identifierPropertyName} property must be required`)
  }

  if (property.type !== 'string' && property.type !== 'number') {
    throw new Error(`${schema.name}.${identifierPropertyName} property must be a string or a number`)
  }

  const trackedIds = new Set<string>()
  const identifierProperty = { name: identifierPropertyName, ...property }

  const validations: PropertyValidation = [
    (input: any) => {
      const inputId = input?.[identifierPropertyName]
      if (inputId == null || identifierProperty?.multiple) {
        return undefined
      }
      if (trackedIds.has(inputId)) {
        return {
          property: identifierProperty.name,
          type: 'ALREADY_TRACKED',
          description: 'input already tracked',
        }
      }
      trackedIds.add(inputId)
    },
  ]

  return new PropertyValidator(validations)
}
