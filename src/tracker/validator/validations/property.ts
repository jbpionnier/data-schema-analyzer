import { AnalyzeAndInpect, EnumType, getInputType, Namespace, PropertyResult, PropertyValidationParams } from './'
import { arrayInformations, arrayValidations } from './array'
import { enumInformations, enumValidations } from './enum'
import { numberInformations, numberValidations } from './number'
import { stringInformations, stringValidations } from './string'

export function requiredValidations({ schema, validator, required }: PropertyValidationParams): void {
  if (required) {
    validator.add((namespace, input) => {
      if (input == null) {
        const hasEnumValues = 'items' in schema && 'values' in schema.items && Array.isArray(schema.items?.values)
        return {
          property: namespace,
          type: 'REQUIRED',
          description: 'required property is missing',
          example: hasEnumValues ? `[${(schema.items as EnumType)?.enum?.join(' | ')}]` : `[${schema.type}]`,
        }
      }
    })
  }
}

type ValuesInfo = { notNull?: boolean; isNull?: boolean }

export function optionalInformations({ schema, required, validator, analyze }: PropertyValidationParams): void {
  if (!required && !schema.ignoreUnusedProperty && analyze instanceof AnalyzeAndInpect) {
    const valuesInfoByNamespace = new Map<Namespace, ValuesInfo>()

    validator.add((namespace: Namespace, input) => {
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

export function singleValueInformations({ schema, required, validator, analyze }: PropertyValidationParams): void {
  const simpleRequiredType = required
    && !schema.ignoreUnusedProperty
    && analyze instanceof AnalyzeAndInpect
    && ['string', 'number', 'boolean', 'enum'].includes(schema.type)

  if (simpleRequiredType) {
    const valuesUsedByNamespace = new Map<Namespace, Set<any>>()
    validator.add((namespace: Namespace, input) => {
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

export function typeValidations({ schema, required, validator, analyze }: PropertyValidationParams): void {
  if (!['enum', 'object'].includes(schema.type)) {
    validator.add((namespace, input) => {
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
      if ('enum' in schema) {
        enumInformations({ schema, required, validator, analyze })
        enumValidations({ schema, required, validator, analyze })
      } else {
        stringInformations({ schema, required, validator, analyze })
        stringValidations({ schema, required, validator, analyze })
      }
      break
    }
    case 'number':
    case 'integer': {
      numberInformations({ schema, required, validator, analyze })
      numberValidations({ schema, required, validator, analyze })
      break
    }
    case 'array': {
      arrayInformations({ schema, required, validator, analyze })
      arrayValidations({ schema, required, validator, analyze })
      break
    }
    default: {
      const typeName = Array.isArray(schema)
        ? `[${schema.map(({ type }) => type).join(' | ')}]`
        : schema.type
      if (!['boolean', 'object'].includes(typeName)) {
        validator.add((namespace, input) => {
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

export function notNullValidations({ validator }: PropertyValidationParams): void {
  const resultOk: PropertyResult = { property: '' as Namespace, description: '', type: 'OK' }
  validator.add((_namespace, input) => {
    if (input == null) {
      return resultOk
    }
  })
}
