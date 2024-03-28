import { Schema, TypeName } from '../../../schema'
import { Analyze, AnalyzeAndInpect } from '../../analyze'
import { Namespace, PropertyResult } from '../../index'
import { PropertyValidator } from '../validator'

export * from '../../../schema'
export { Analyze, AnalyzeAndInpect } from '../../analyze'
export { Informer, Namespace, PropertyResult } from '../../index'
export { checkSchemaType, getInputType, getSchemaType, TypeInt } from '../schema-type'

export const propertyResultOk: PropertyResult = { property: '' as Namespace, description: '', type: 'OK' }

export type PropertyValidationParams<S extends { type: TypeName } = Schema, I = any> = {
  analyze: Analyze
  schema: S
  validator: PropertyValidator<I>
  required: boolean
}

export type PropertyInformationParams<S extends { type: TypeName } = Schema, I = any> = {
  analyze: AnalyzeAndInpect
  schema: S
  validator: PropertyValidator<I>
  required: boolean
}

export type StatsStringValue = {
  count: number
  empty: number
  notEmpty: number
  minLength?: number
  maxLength?: number
}

export type StatsNumberValue = {
  count: number
  minimum?: number
  maximum?: number
}

export type StatsArrayValue = {
  count: number
  empty: number
  notEmpty: number
  minItems?: number
  maxItems?: number
}

export type StatsEnumValue = {
  count: number
  enum: {
    [key: string]: number
  }
}

export function getSchemaKeys<T extends {}>(schema: T, keys: Array<keyof T>): Partial<T> {
  return keys.reduce<any>((acc, key) => {
    const value = schema[key]
    if (value != null) {
      acc[key] = value
    }
    return acc
  }, {})
}
