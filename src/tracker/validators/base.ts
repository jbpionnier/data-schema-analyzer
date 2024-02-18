import { EnumType, Schema } from '../../schema'
import { PropertiesValidation, PropertyResult, Reporters } from '../index'
import { ObjectValidator } from '../validator'
import { objectValidators } from './object'

export function getObjectValidator({ namespace, schema, reporting }: {
  namespace: string
  reporting: Reporters | undefined
  schema:
    | Schema & {
      validator?: ObjectValidator
    }
    | undefined
}): ObjectValidator {
  if (schema == null) {
    const validations: PropertiesValidation = [
      (input: any) => {
        return [{
          property: namespace,
          type: 'UNKNOWN',
          description: 'unknown property',
          example: input,
        }]
      },
    ]
    return new ObjectValidator(validations)
  }

  if (!schema.validator) {
    const validations = getObjectValidations({ namespace, schema, reporting })
    schema.validator = new ObjectValidator(validations)
  }

  return schema.validator
}

function getObjectValidations({ namespace, schema, reporting }: {
  namespace: string
  schema: Schema
  reporting: Reporters | undefined
}): PropertiesValidation {
  const validations: PropertiesValidation = []

  baseValidators({ namespace, schema, validations, reporting })

  if ('properties' in schema) {
    const propertiesList = Object.keys(schema.properties)
    validations.push((input: any): PropertyResult[] => {
      if (input == null) { return [] }

      const propertiesFullList = new Set<string>(propertiesList.concat(Object.keys(input)))
      return Array.from(propertiesFullList)
        .flatMap<PropertyResult>((property) => {
          const fullNamespace = namespace ? `${namespace}.${property}` : property
          const validator = getObjectValidator({
            schema: schema.properties[property],
            namespace: fullNamespace,
            reporting,
          })
          return validator.validate(input[property])
        })
    })
    return validations
  }

  objectValidators({ schema, namespace, validations, reporting })

  const itemsInSchema = 'items' in schema
  const itemsWithProperties = itemsInSchema && 'properties' in schema.items
  if (itemsWithProperties) {
    const validator = getObjectValidator({
      namespace,
      schema: schema.required ? { ...schema.items, required: true } : schema.items,
      reporting,
    })
    validations.push((input: any) => {
      if (Array.isArray(input)) {
        return input.flatMap((value: any) => validator.validate(value))
      }
    })
    return validations
  }

  if (itemsInSchema) {
    const validator = getObjectValidator({ namespace, schema: schema.items, reporting })
    validations.push((input: any) => {
      if (Array.isArray(input)) {
        return input.flatMap((value: any) => validator.validate(value))
      }
    })
  }

  return validations
}

function baseValidators({ namespace, schema, validations, reporting }: {
  schema: Schema
  validations: PropertiesValidation
  reporting: Reporters | undefined
  namespace: string
}): void {
  if (schema.required) {
    validations.push((input: any) => {
      if (input == null) {
        const hasEnumValues = 'items' in schema && 'values' in schema.items && Array.isArray(schema.items?.values)
        return [{
          property: namespace,
          type: 'REQUIRED',
          description: 'required property is missing',
          example: hasEnumValues ? `[${(schema.items as EnumType)?.values?.join(' | ')}]` : `[${schema.type}]`,
        }]
      }
    })
  }

  if (!schema.required && !schema.ignoreUnusedProperty && !!namespace && reporting) {
    const valuesInfo: { notNull?: boolean; isNull?: boolean } = {}
    validations.push((input: any) => {
      valuesInfo.notNull = valuesInfo.notNull || input != null
      valuesInfo.isNull = valuesInfo.isNull || input == null
    })

    reporting.push(() => {
      if (!valuesInfo.isNull) {
        return {
          property: namespace,
          type: 'ALWAYS_PRESENT',
          description: 'optional property always present',
        }
      }

      if (!valuesInfo.notNull) {
        return {
          property: namespace,
          type: 'NEVER_USED',
          description: 'optional property never used',
        }
      }
    })
  }

  const simpleRequiredType = schema.required
    && !schema.ignoreUnusedProperty
    && reporting
    && ['string', 'number', 'boolean', 'enum'].includes(schema.type)

  if (simpleRequiredType) {
    const valuesUsed = new Set<any>()
    validations.push((input: any) => {
      if (valuesUsed.size < 2) {
        valuesUsed.add(input)
      }
    })

    reporting.push(() => {
      if (valuesUsed.size === 1) {
        return {
          property: namespace,
          type: 'SINGLE_VALUE',
          description: 'property always have the same single value',
          example: valuesUsed.keys().next().value,
        }
      }
    })
  }
}
