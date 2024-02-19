import { EnumType, Schema } from '../../schema'
import { PropertyResult } from '../index'
import { arrayValidations } from './array'
import { enumValidations } from './enum'
import { getInputType, PropertyValidationParams } from './index'
import { numberValidations } from './number'
import { stringValidations } from './string'

export function requiredValidations({ namespace, schema, validations }: PropertyValidationParams<Schema>): void {
  if (schema.required) {
    validations.push((input: any) => {
      if (input == null) {
        const hasEnumValues = 'items' in schema && 'values' in schema.items && Array.isArray(schema.items?.values)
        return {
          property: namespace,
          type: 'REQUIRED',
          description: 'required property is missing',
          example: hasEnumValues ? `[${(schema.items as EnumType)?.values?.join(' | ')}]` : `[${schema.type}]`,
        }
      }
    })
  }
}

export function optionalValidations({ namespace, schema, validations, reporting }: PropertyValidationParams<Schema>): void {
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
}

export function singleValueValidations({ namespace, schema, validations, reporting }: PropertyValidationParams<Schema>): void {
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

export function typeValidations({ namespace, schema, validations, reporting }: PropertyValidationParams<Schema>): void {
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
      stringValidations({ namespace, schema, validations, reporting })
      break
    }
    case 'number': {
      numberValidations({ namespace, schema, validations, reporting })
      break
    }
    case 'enum': {
      enumValidations({ namespace, schema, validations, reporting })
      break
    }
    case 'array': {
      arrayValidations({ namespace, schema, validations, reporting })
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
}

export function notNullValidations({ namespace, validations }: PropertyValidationParams<Schema>): void {
  const resultOk: PropertyResult = { property: namespace, description: 'property ok', type: 'OK' }
  validations.push((input: any) => {
    if (input == null) {
      return resultOk
    }
  })
}
