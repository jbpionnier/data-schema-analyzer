import { ArrayTypeNode, Identifier, InterfaceDeclaration, JSDocableNode, Node, Project, PropertySignature, SourceFile, ts, TupleTypeNode,
  TypeAliasDeclaration, TypeLiteralNode, TypeNode, TypeReferenceNode, UnionTypeNode } from 'ts-morph'
import { ArrayType, EnumType, ObjectProperties, ObjectType, PrimitiveType, Schema, ValueType } from './schema'

export type GenerateOptions = {
  fileNameOrPath: string
  rootInterfaceName: string
  imports?: string[]
}

export class SourceFiles {
  constructor(
    private readonly sourceFiles: SourceFile[],
  ) {}

  getTypeAlias(name: string): TypeAliasDeclaration | undefined {
    return this.sourceFiles
      .map((sourceFile) => sourceFile.getTypeAlias(name))
      .find((typeAlias) => !!typeAlias)
  }
}

export class SchemaGenerator {
  private readonly project: Project

  constructor(opts: {
    tsConfigFilePath: string
  }) {
    this.project = new Project({ tsConfigFilePath: opts.tsConfigFilePath })
  }

  generate(opts: GenerateOptions): Schema & ObjectType {
    const sourceFiles = new SourceFiles(this.project.getSourceFiles([
      opts.fileNameOrPath,
      ...opts.imports || [],
    ]))
    const typeAlias = sourceFiles.getTypeAlias(opts.rootInterfaceName)
    if (!typeAlias) {
      throw new Error(`Type "${opts.rootInterfaceName}" not found in "${opts.fileNameOrPath}"`)
    }
    return this.getValueType(typeAlias.getTypeNode() as TypeNode, sourceFiles, '') as Schema & ObjectType // TODO
  }

  private getValueType(node: Node, sourceFiles: SourceFiles, propertyName: string): ValueType {
    // https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts#L93
    switch (node.getKind()) {
      case ts.SyntaxKind.StringKeyword:
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.ObjectKeyword: {
        const type: PrimitiveType = {
          type: node.getText() as any,
        }
        return type
      }
      case ts.SyntaxKind.UnionType: {
        const type: EnumType = {
          type: 'enum',
          values: (node as any).getTypeNodes().map((node: any) => this.getValueType(node, sourceFiles, propertyName)).sort(),
        }
        return type
      }
      case ts.SyntaxKind.LiteralType: {
        return node.getText().replaceAll("'", '') as any
        // return this.getValueType((node as any).getLiteral())
      }
      case ts.SyntaxKind.TemplateLiteralType: {
        return { type: 'string' }
      }
      case ts.SyntaxKind.StringLiteral: {
        return node.getText().replaceAll("'", '') as any
      }
      case ts.SyntaxKind.FirstLiteralToken: {
        return node.getText() as any
      }
      case ts.SyntaxKind.TypeLiteral: {
        const type: ObjectType = {
          type: 'object',
          properties: this.getProperties(node as TypeLiteralNode, sourceFiles),
        }
        return type
      }
      case ts.SyntaxKind.TypeReference: {
        // // TODO
        // const type: PrimitiveType = {
        //   type: 'object',
        //   ref: node.getText(),
        // }
        // return type
        const identifier = (node as TypeReferenceNode).getTypeName()
        const name = (identifier as Identifier).compilerNode.escapedText as string

        const typeAlias = sourceFiles.getTypeAlias(name)
        if (typeAlias) {
          return this.getValueType(typeAlias.getTypeNode() as TypeNode, sourceFiles, propertyName)
        }

        return this.getTypeReferenceSchema(node as TypeReferenceNode, sourceFiles, propertyName)
      }
      case ts.SyntaxKind.IntersectionType: {
        const types = (node as UnionTypeNode).getTypeNodes()
        const type: any = {
          type: 'object',
          properties: types
            .map((typeNode): any => (this.getValueType(typeNode, sourceFiles, propertyName) as any).properties)
            .reduce<any>((acc: any, valueType) => {
              return {
                ...acc,
                ...valueType,
              }
            }, {}),
        }
        return type
      }
      case ts.SyntaxKind.ArrayType: {
        const type: ArrayType = {
          type: 'array',
          items: this.getValueType((node as ArrayTypeNode).getElementTypeNode(), sourceFiles, propertyName),
        }
        return type
      }
      case ts.SyntaxKind.TupleType: {
        const type: ArrayType = {
          type: 'array',
          items: (node as TupleTypeNode).getElements()
            .map((typeNode): any => (this.getValueType(typeNode, sourceFiles, propertyName) as any)) as any,
        }
        return type
      }
      case ts.SyntaxKind.UndefinedKeyword: {
        const type: PrimitiveType = {
          type: 'object',
          ref: ts.SyntaxKind[node.getKind()],
        }
        return type
      }

      default: {
        console.warn(`[Tracker] Unknown Type for "${propertyName}": ${ts.SyntaxKind[node.getKind()]}`)
        const type: PrimitiveType = {
          type: 'object',
          ref: ts.SyntaxKind[node.getKind()],
        }
        return type
      }
    }
  }

  private getProperties(node: InterfaceDeclaration | TypeLiteralNode, sourceFiles: SourceFiles): ObjectProperties {
    return node.getProperties()
      .reduce<ObjectProperties>((prev, property) => {
        const name = property.getName()
        const schema = this.getTypeNodeSchema(property, sourceFiles)
        prev[name] = schema
        return prev
      }, {})
  }

  private getTypeNodeSchema(node: PropertySignature, sourceFiles: SourceFiles): Schema {
    const name = node.getName()
    const valueType = this.getValueType(node?.getTypeNode() as Node, sourceFiles, name)
    const tags = convertTags(getJsDocTags(node))
    if (tags.pattern && valueType.type === 'object' && 'ref' in valueType) {
      valueType.type = 'string'
    }

    const hasUndefinedKeyword = (valueType as EnumType)?.values?.some(({ type, ref }: any) => type === 'object' && ref === 'UndefinedKeyword')
    const isRequired = !node.hasQuestionToken() && !hasUndefinedKeyword
    const valueTypeValid: ValueType = hasUndefinedKeyword && 'values' in valueType && valueType.values[0] ? valueType.values[0] as any : valueType

    return {
      ...tags,
      ...isRequired ? { required: true } : null,
      ...typeof valueTypeValid === 'string'
        ? {
          type: 'enum',
          values: [valueTypeValid],
        }
        : valueTypeValid,
    }
  }

  private getTypeReferenceSchema(node: TypeReferenceNode, sourceFiles: SourceFiles, propertyName: string): ValueType {
    // https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts#L157
    const text = node.getText()
    const name = node.getTypeName().getText()
    if (name === 'Array') {
      return {
        type: 'array',
        items: this.getValueType(node.getTypeArguments()[0], sourceFiles, propertyName),
      }
    }

    // if (text !== 'BigQueryTimestamp') {
    //   console.warn(`[Tracker] Type Reference not found for ${propertyName}`, text, name)
    // }
    const type: PrimitiveType = {
      type: 'object',
      ref: text,
    }
    return type
  }
}

function getJsDocTags(node: JSDocableNode): { [name: string]: any } {
  return node.getJsDocs().reduce<any>((prev, jsdoc) => {
    return {
      ...prev,
      ...jsdoc.getTags().reduce((prop, value) => (value.getKind() === ts.SyntaxKind.JSDocTag
        ? {
          ...prop,
          [value.getTagName()]: value.getComment() ?? true,
        }
        : prop), {}),
    }
  }, {})
}

function convertTags(tags: { [name: string]: any }): { [name: string]: any } {
  const numberAttrs = ['minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength']
  return numberAttrs.reduce((newTags, name) => {
    if (tags[name] != null) {
      newTags[name] = getTagValue(tags[name], 'number')
    }
    return newTags
  }, tags)
}

function getTagValue(tag: string, type: 'string' | 'number' | 'boolean'): boolean | number | string {
  if (type === 'number') {
    return Number(tag)
  }
  if (type === 'boolean') {
    return tag !== 'false'
  }
  return tag
}
