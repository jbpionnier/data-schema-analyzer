import { TypeName } from '../../schema'
import { Analyze, AnalyzeAndInpect } from '../analyze'
import { PropertyValidation } from '../property-validator'

export { Analyze, AnalyzeAndInpect } from '../analyze'
export { Namespace, PropertyResult } from '../index'
export { PropertyValidation } from '../property-validator'

export type PropertyValidationParams<T extends { type: TypeName }, V = any> = {
  analyze: Analyze | AnalyzeAndInpect
  schema: T
  validations: PropertyValidation<V>
  required: boolean
}

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
