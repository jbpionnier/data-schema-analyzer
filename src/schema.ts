export type PrimitiveType = {
  type: 'boolean' | 'any' | 'object' | 'null'
  ref?: string
}
export type StringType = {
  type: 'string'
  ref?: string
  id?: true
  multiple?: true
  minLength?: number
  maxLength?: number
  pattern?: string
}
export type NumberType = {
  type: 'number'
  id?: true
  multiple?: true
  minimum?: number
  maximum?: number
}
export type EnumType = {
  type: 'enum'
  ignoreUnusedValues?: true
  values: Array<string | number | ObjectType>
}
export type ObjectType = {
  type: 'object'
  properties: ObjectProperties
}
export type ArrayType = {
  type: 'array'
  minItems?: number
  maxItems?: number
  items: ValueType
}

export type ValueType = PrimitiveType | StringType | NumberType | EnumType | ObjectType | ArrayType

export type Schema = ValueType & {
  required?: true
  ignoreUnusedProperty?: true
}

export type ObjectProperties = {
  [key: string]: Schema
}

export type RootSchema = ObjectType & {
  name: string
  identifierProperty?: string
}

export type IdentifierProperty = StringType & { name: string }

export function getIdentifierPropertyName(schema: ObjectType): string | undefined {
  // @ts-expect-error
  const [identifierPropertyName] = Object.entries<StringType>(schema.properties)
    .find(([_propertyName, property]) => property.id === true) || []
  return identifierPropertyName
}
