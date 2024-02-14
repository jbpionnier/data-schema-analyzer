export type ObjectType = {
  type: 'object'
  properties: ObjectProperties
}

export type PrimitiveType = {
  type: 'string' | 'number' | 'boolean' | 'any' | 'object' | 'null'
  ref?: string
}
export type EnumType = {
  type: 'enum'
  values: Array<string | number>
}

export type ArrayType = {
  type: 'array'
  items: ValueType
}

export type ValueType = PrimitiveType | EnumType | ObjectType | ArrayType

export type Schema = {
  required?: true
  id?: true
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  pattern?: string | RegExp
  ignoreUnusedValues?: true
  ignoreUnusedProperty?: true
  multiple?: true
} & ValueType

export type ObjectProperties = {
  [key: string]: Schema
}
