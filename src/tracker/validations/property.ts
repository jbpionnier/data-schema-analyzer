import { EnumType, Schema } from '../../schema'
import { AnalyzeAndInpect, getInputType, Namespace, PropertyResult, PropertyValidationParams } from './'
import { arrayValidations } from './array'
import { enumValidations } from './enum'
import { numberValidations } from './number'
import { stringValidations } from './string'

export function requiredValidations({ schema, validations, required }: PropertyValidationParams<Schema>): void {
  if (required) {
    validations.push((namespace, input) => {
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

type ValuesInfo = { notNull?: boolean; isNull?: boolean }

export function optionalValidations({ schema, required, validations, analyze }: PropertyValidationParams<Schema>): void {
  if (!required && !schema.ignoreUnusedProperty && analyze instanceof AnalyzeAndInpect) {
    const valuesInfoByNamespace = new Map<Namespace, ValuesInfo>()

    validations.push((namespace, input) => {
      let valuesInfo = valuesInfoByNamespace.get(namespace)
      if (!valuesInfo) {
        valuesInfo = {}
        valuesInfoByNamespace.set(namespace, valuesInfo)
      }
      valuesInfo.notNull = valuesInfo.notNull || input != null
      valuesInfo.isNull = valuesInfo.isNull || input == null
    })

    analyze.report(() => {
      const valuesInfoByNamespaceList = Array.from(valuesInfoByNamespace)
      const alwaysPresent = valuesInfoByNamespaceList
        .filter(([_namespace, valuesInfo]) => !valuesInfo.isNull)
        .map(([namespace]): PropertyResult => {
          return {
            property: namespace,
            type: 'ALWAYS_PRESENT',
            description: 'optional property always present',
          }
        })

      const newUsed = valuesInfoByNamespaceList
        .filter(([_namespace, valuesInfo]) => !valuesInfo.notNull)
        .map(([namespace]): PropertyResult => {
          return {
            property: namespace,
            type: 'NEVER_USED',
            description: 'optional property never used',
          }
        })

      return alwaysPresent.concat(newUsed)
    })
  }
}

export function singleValueValidations({ schema, required, validations, analyze }: PropertyValidationParams<Schema>): void {
  const simpleRequiredType = required
    && !schema.ignoreUnusedProperty
    && analyze instanceof AnalyzeAndInpect
    && ['string', 'number', 'boolean', 'enum'].includes(schema.type)

  if (simpleRequiredType) {
    const valuesUsedByNamespace = new Map<Namespace, Set<any>>()
    validations.push((namespace, input) => {
      let valuesUsed = valuesUsedByNamespace.get(namespace)
      if (!valuesUsed) {
        valuesUsed = new Set()
        valuesUsedByNamespace.set(namespace, valuesUsed)
      }
      if (valuesUsed.size < 2) {
        valuesUsed.add(input)
      }
    })

    analyze.report(() => {
      return Array.from(valuesUsedByNamespace)
        .filter(([_namespace, valuesUsed]) => valuesUsed.size === 1)
        .map(([namespace, valuesUsed]): PropertyResult => {
          return {
            property: namespace,
            type: 'SINGLE_VALUE',
            description: 'property always have the same single value',
            example: valuesUsed.keys().next().value,
          }
        })
    })
  }
}

export function typeValidations({ schema, required, validations, analyze }: PropertyValidationParams<Schema>): void {
  if (!['enum', 'object'].includes(schema.type)) {
    validations.push((namespace, input) => {
      const inputType = getInputType(input)
      if (schema.type === 'integer' && inputType === 'number') {
        return
      }
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
      stringValidations({ schema, required, validations, analyze })
      break
    }
    case 'number':
    case 'integer': {
      numberValidations({ schema, required, validations, analyze })
      break
    }
    case 'enum': {
      enumValidations({ schema, required, validations, analyze })
      break
    }
    case 'array': {
      arrayValidations({ schema, required, validations, analyze })
      break
    }
    default: {
      const typeName = Array.isArray(schema)
        ? `[${schema.map(({ type }) => type).join(' | ')}]`
        : schema.type
      if (!['boolean', 'object'].includes(typeName)) {
        validations.push((namespace, input) => {
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

export function notNullValidations({ validations }: PropertyValidationParams<Schema>): void {
  const resultOk: PropertyResult = { property: '' as Namespace, description: '', type: 'OK' }
  validations.push((_namespace, input) => {
    if (input == null) {
      return resultOk
    }
  })
}
