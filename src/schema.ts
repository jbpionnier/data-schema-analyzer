import { JSONSchema7Type, JSONSchema7TypeName } from 'json-schema'

export type TypeName = JSONSchema7TypeName
export type JsonType = JSONSchema7Type

export type CommonType = {
  ignoreUnusedValues?: true
  ignoreUnusedProperty?: true
}

export type AnyType = {
  type: 'null' | 'object'
  $ref?: string
}
export type BooleanType = {
  type: 'boolean'
}
export type StringType = {
  type: 'string'
  $ref?: string
  id?: true
  multiple?: true
  minLength?: number
  maxLength?: number
  pattern?: string
}
export type NumberType = {
  type: 'number' | 'integer'
  $ref?: string
  id?: true
  multiple?: true
  minimum?: number
  exclusiveMinimum?: number
  maximum?: number
  exclusiveMaximum?: number
}
export type EnumType = {
  type: 'string'
  ignoreUnusedValues?: true
  enum: Array<string | number | ObjectType>
}
export type ObjectType = {
  type: 'object'
  required: string[]
  properties: ObjectProperties
}
export type ArrayType = {
  type: 'array'
  minItems?: number
  maxItems?: number
  items: ItemsType & CommonType
}
export type ItemsType = StringType | BooleanType | NumberType | EnumType | ObjectType | AnyType

export type ValueType = StringType | BooleanType | NumberType | EnumType | ObjectType | ArrayType | AnyType

export type Schema = ValueType & CommonType

export type ObjectProperties = {
  [key: string]: Schema
}

export type RootSchema = {
  $ref: string
  definitions: {
    [key: string]: ObjectType | EnumType
  }
}
