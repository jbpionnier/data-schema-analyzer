import { Schema, TypeName } from '../../../schema'
import { Analyze, AnalyzeAndInpect } from '../../analyze'
import { Validator } from '../validator'

export * from '../../../schema'
export { Analyze, AnalyzeAndInpect } from '../../analyze'
export { Informer, Namespace, PropertyResult } from '../../index'

export type PropertyValidationParams<S extends { type: TypeName } = Schema, I = any> = {
  analyze: Analyze
  schema: S
  validator: Validator<I>
  required: boolean
}

export type PropertyInformationParams<S extends { type: TypeName } = Schema, I = any> = {
  analyze: AnalyzeAndInpect
  schema: S
  validator: Validator<I>
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

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
