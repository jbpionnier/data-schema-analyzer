import { TypeName } from '../../schema'
import { Namespace } from '../'
import { Analyze, AnalyzeAndInpect } from '../analyze'
import { PropertyValidation } from '../property-validator'

export { Analyze, AnalyzeAndInpect } from '../analyze'
export { Namespace, PropertyResult } from '../index'
export { PropertyValidation } from '../property-validator'

export type PropertyValidationParams<T extends { type: TypeName }> = {
  namespace: Namespace
  schema: T
  validations: PropertyValidation
  analyze: Analyze | AnalyzeAndInpect
}

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
