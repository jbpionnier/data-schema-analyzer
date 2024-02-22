import { Schema, TypeName } from '../../../schema'
import { Analyze, AnalyzeAndInpect } from '../../analyze'
import { Validator } from '../validator'

export * from '../../../schema'
export { Analyze, AnalyzeAndInpect } from '../../analyze'
export { Informer, Namespace, PropertyResult } from '../../index'

export type PropertyValidationParams<S extends { type: TypeName } = Schema, I = any> = {
  analyze: Analyze | AnalyzeAndInpect
  schema: S
  validator: Validator<I>
  required: boolean
}

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
