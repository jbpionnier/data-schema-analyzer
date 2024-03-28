export enum TypeInt {
  STRING,
  BOOLEAN,
  NUMBER,
  INTEGER,
  OBJECT,
  ARRAY,
  UNKNOWN,
  NULL,
}

const TYPE_MAPPING: { [type: string]: TypeInt } = {
  string: TypeInt.STRING,
  number: TypeInt.NUMBER,
  integer: TypeInt.INTEGER,
  boolean: TypeInt.BOOLEAN,
  object: TypeInt.OBJECT,
  array: TypeInt.ARRAY,
  null: TypeInt.NULL,
}

export function getInputType(input: any): TypeInt {
  if (input == null) {
    return TypeInt.NULL
  }
  const inputTypeOf = Array.isArray(input) ? 'array' : typeof input
  const inputType = TYPE_MAPPING[inputTypeOf]
  if (inputType != null) {
    return inputType
  }
  console.error('Unknown input type', typeof input, input)
  return TypeInt.UNKNOWN
}

export function checkSchemaType(schema: { type: string }, valueType: TypeInt): boolean {
  const schemaType = getSchemaType(schema)
  return schemaType === valueType
}

export function getSchemaType(schema: { typeInt?: TypeInt; type: string }): TypeInt {
  if (schema.typeInt == null) {
    schema.typeInt = findSchemaType(schema)
  }
  return schema.typeInt
}

function findSchemaType(schema: { type: string }): TypeInt {
  if (schema.type == null) {
    console.error('type is not defined in schema', schema)
    return TypeInt.UNKNOWN
  }
  const schemaType = TYPE_MAPPING[schema.type]
  if (schemaType != null) {
    return schemaType
  }
  console.error('Unknown schema type', schema.type, schema)
  return TypeInt.UNKNOWN
}

export function isArrayType(_arg: any, type: TypeInt): _arg is any[] {
  return type === TypeInt.ARRAY
}
