import { TypeName } from '../../schema'
import { Namespace, Reporters } from '../'
import { PropertyValidation } from '../property-validator'

export type PropertyValidationParams<T extends { type: TypeName }> = {
  namespace: Namespace
  schema: T
  reporting: Reporters | undefined
  validations: PropertyValidation
}

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
