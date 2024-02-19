import { Schema } from '../../schema'
import { Namespace, Reporters } from '../'
import { PropertiesValidation } from '../object-validator'
import { PropertyValidation } from '../property-validator'

type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'enum'
  | 'array'
  | 'null'

export type PropertyValidationParams<T extends { type: PropertyType }> = {
  namespace: Namespace
  schema: T
  reporting: Reporters | undefined
  validations: PropertyValidation
}

export type PropertiesValidationParams = {
  namespace: Namespace
  schema: Schema
  reporting: Reporters | undefined
  validations: PropertiesValidation
}

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
