export type TypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

export type PrimitiveType = {
  type: 'boolean' | 'object' | 'null'
  $ref?: string
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
  items: Schema
}

export type ValueType = PrimitiveType | StringType | NumberType | EnumType | ObjectType | ArrayType

export type Schema = ValueType & {
  ignoreUnusedValues?: true
  ignoreUnusedProperty?: true
}

export type ObjectProperties = {
  [key: string]: Schema | undefined
}

export type RootSchema = {
  $ref: string
  definitions: {
    [key: string]: ObjectType | EnumType
  }
}
