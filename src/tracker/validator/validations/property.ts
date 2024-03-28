import { arrayInformations, arrayValidations } from './array'
import { enumInformations, enumValidations } from './enum'
import { AnalyzeAndInpect, ArrayType, checkSchemaType, EnumType, getSchemaType, Namespace, NumberType, PropertyInformationParams, PropertyResult,
  propertyResultOk, PropertyValidationParams, StringType, TypeInt } from './index'
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

export function optionalInformations({ schema, required, validator, analyze }: PropertyInformationParams): void {
  if (required || schema.ignoreUnusedProperty) {
    return
  }

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

  analyze.report((propertiesResult: PropertyResult[]) => {
    for (const [namespace, valuesInfo] of valuesInfoByNamespace) {
      if (!valuesInfo.isNull) {
        propertiesResult.push({
          property: namespace,
          type: 'ALWAYS_PRESENT',
          description: 'optional property always present',
        })
      }

      if (!valuesInfo.notNull) {
        propertiesResult.push({
          property: namespace,
          type: 'NEVER_USED',
          description: 'optional property never used',
        })
      }
    }
  })
}

const SIMPLE_TYPE = new Set<TypeInt>([TypeInt.STRING, TypeInt.NUMBER, TypeInt.BOOLEAN])

export function singleValueInformations({ schema, required, validator, analyze }: PropertyInformationParams): void {
  const schemaType = getSchemaType(schema)
  const simpleRequiredType = required
    && !schema.ignoreUnusedProperty
    && SIMPLE_TYPE.has(schemaType)

  if (simpleRequiredType) {
    const valuesUsedByNamespace = new Map<Namespace, Set<unknown>>()
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

    analyze.report((propertiesResult: PropertyResult[]) => {
      for (const [namespace, valuesUsed] of valuesUsedByNamespace) {
        if (valuesUsed.size === 1) {
          propertiesResult.push({
            property: namespace,
            type: 'SINGLE_VALUE',
            description: 'property always have the same single value',
            example: valuesUsed.keys().next().value,
          })
        }
      }
    })
  }
}

export function typeValidations({ schema, required, validator, analyze }: PropertyValidationParams): void {
  if (!checkSchemaType(schema, TypeInt.OBJECT)) {
    validator.add((namespace, input, inputType) => {
      if (checkSchemaType(schema, TypeInt.INTEGER) && inputType === TypeInt.NUMBER) {
        return
      }
      if (!checkSchemaType(schema, inputType)) {
        return {
          property: namespace,
          type: 'TYPE',
          description: `property type is not ${schema.type}`,
          example: JSON.stringify(input),
        }
      }
    })
  }

  const analyzeInspect = analyze instanceof AnalyzeAndInpect
  const analyzeInfoValues = analyzeInspect && analyze.infoValues
  const schemaType = getSchemaType(schema)

  switch (schemaType) {
    case TypeInt.STRING: {
      if ('enum' in schema) {
        analyzeInspect && enumInformations({ schema, required, validator, analyze })
        enumValidations({ schema, required, validator, analyze })
      } else {
        analyzeInfoValues && stringInformations({ schema, required, validator, analyze } as PropertyInformationParams<StringType, string>)
        stringValidations({ schema, required, validator, analyze } as PropertyValidationParams<StringType, string>)
      }
      break
    }
    case TypeInt.NUMBER:
    case TypeInt.INTEGER: {
      analyzeInfoValues && numberInformations({ schema, required, validator, analyze } as PropertyInformationParams<NumberType, number>)
      numberValidations({ schema, required, validator, analyze } as PropertyValidationParams<NumberType, number>)
      break
    }
    case TypeInt.ARRAY: {
      analyzeInfoValues && arrayInformations({ schema, required, validator, analyze } as PropertyInformationParams<ArrayType, object[]>)
      arrayValidations({ schema, required, validator, analyze } as PropertyValidationParams<ArrayType, []>)
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
  validator.add((_namespace, input) => {
    if (input == null) {
      return propertyResultOk
    }
  })
}
