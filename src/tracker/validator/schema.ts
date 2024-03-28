import { Schema } from '../../schema'
import { Analyze } from '../analyze'
import { getArrayValidator } from './array'
import { getObjectValidator } from './object'
import { getPropertyValidator } from './property'
import { Validator } from './validator'

export function getSchemaValidator({ analyze, schema, required }: { analyze: Analyze<any>; schema: Schema; required: boolean }): Validator {
  if ('properties' in schema) {
    return getObjectValidator({ analyze, schema })
  }
  if ('items' in schema) {
    return getArrayValidator({ schema, required, analyze })
  }
  return getPropertyValidator({ schema, required, analyze })
}
