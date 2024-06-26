import * as fs from 'node:fs'
import * as Path from 'path'
import { ArrayTypeNode, Identifier, InterfaceDeclaration, JSDocableNode, Node, Project, PropertySignature, ts, TupleTypeNode, TypeLiteralNode,
  TypeNode, TypeReferenceNode, UnionTypeNode } from 'ts-morph'
import { AnyType, ArrayType, EnumType, ItemsType, ObjectType, RootSchema, Schema, ValueType } from '../schema'
import { SourceFiles } from './source-files'

export type GenerateOptions = {
  rootInterfaceName: string
  sourceFiles: string[]
}

export class SchemaGenerator {
  private readonly projects: Project[]

  private definitions: { [key: string]: ObjectType } = {}

  constructor(opts: {
    tsConfigFilePath: string | string[]
  }) {
    this.projects = Array.isArray(opts.tsConfigFilePath)
      ? opts.tsConfigFilePath.map((tsConfigFilePath) => new Project({ tsConfigFilePath }))
      : [new Project({ tsConfigFilePath: opts.tsConfigFilePath })]
  }

  private getSourceFiles(globPatterns: ReadonlyArray<string>): SourceFiles {
    const sourceFiles = this.projects.flatMap((project) => project.getSourceFiles(globPatterns))
    return new SourceFiles(sourceFiles)
  }

  generate(opts: GenerateOptions): RootSchema {
    const sourceFiles = this.getSourceFiles(opts.sourceFiles)
    const typeAlias = sourceFiles.getTypeAlias(opts.rootInterfaceName)
    if (!typeAlias) {
      throw new Error(`Type "${opts.rootInterfaceName}" not found in :\n"${opts.sourceFiles.join('\n ')}"`)
    }
    this.definitions = {}

    const schema = this.getValueType(typeAlias.getTypeNode() as TypeNode, sourceFiles, '') as ObjectType
    return {
      $ref: opts.rootInterfaceName,
      definitions: {
        ...this.definitions,
        [opts.rootInterfaceName]: schema,
      },
    }
  }

  generateFile(opts: GenerateOptions & { outputFilePath: string }): RootSchema {
    const schema = this.generate(opts)
    const schemaString = JSON.stringify(schema, null, 2)
    const content = opts.outputFilePath.endsWith('.ts')
      ? `/* eslint-disable */
/**
 * File generated by 'data-schema-analyzer' package
 */
import { RootSchema } from "data-schema-analyzer";
export const ${opts.rootInterfaceName}Schema: RootSchema = ${schemaString}`
      : schemaString
    fs.mkdirSync(Path.dirname(opts.outputFilePath), { recursive: true })
    fs.writeFileSync(opts.outputFilePath, content.trim())
    return schema
  }

  private getValueType(node: Node, sourceFiles: SourceFiles, propertyName: string): ValueType | string {
    // https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts#L93
    switch (node.getKind()) {
      case ts.SyntaxKind.StringKeyword:
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.ObjectKeyword: {
        const type: AnyType = {
          type: node.getText() as any,
        }
        return type
      }
      case ts.SyntaxKind.UnionType: {
        const type: EnumType = {
          type: 'string',
          enum: (node as UnionTypeNode).getTypeNodes()
            .map((node) => this.getValueType(node, sourceFiles, propertyName) as string)
            .sort(),
        }
        return type
      }
      case ts.SyntaxKind.LiteralType: {
        return node.getText().replaceAll("'", '')
        // return this.getValueType((node as any).getLiteral())
      }
      case ts.SyntaxKind.TemplateLiteralType: {
        return { type: 'string' }
      }
      case ts.SyntaxKind.StringLiteral: {
        return node.getText().replaceAll("'", '')
      }
      case ts.SyntaxKind.FirstLiteralToken: {
        return node.getText() as any
      }
      case ts.SyntaxKind.TypeLiteral: {
        return this.getObjectType(node as TypeLiteralNode, sourceFiles)
      }
      case ts.SyntaxKind.TypeReference: {
        const identifier = (node as TypeReferenceNode).getTypeName() as Identifier
        const name = identifier.compilerNode.escapedText as string
        const typeAlias = sourceFiles.getTypeAlias(name)
        if (typeAlias) {
          return this.getValueType(typeAlias.getTypeNode() as TypeNode, sourceFiles, propertyName)
          // const propertyType =
          // if (typeof propertyType === 'string' || propertyType.type === 'string') {
          //   return propertyType
          // }
          //
          // if (!this.definitions[name]) {
          //   this.definitions[name] = propertyType as ObjectType
          // }
          //
          // const type: PrimitiveType = {
          //   type: 'object',
          //   $ref: name,
          // }
          // return type
        }

        return this.getTypeReferenceSchema(node as TypeReferenceNode, sourceFiles, propertyName)
      }
      case ts.SyntaxKind.IntersectionType: {
        const [firstTypeNode] = (node as UnionTypeNode).getTypeNodes()
        const firstType = this.getValueType(firstTypeNode, sourceFiles, propertyName)
        if (typeof firstType !== 'string' && ['string', 'number'].includes(firstType.type)) {
          return firstType
        }

        const objectType: ObjectType = (node as UnionTypeNode).getTypeNodes()
          .map((typeNode): ObjectType => (this.getValueType(typeNode, sourceFiles, propertyName) as ObjectType))
          .reduce<ObjectType>((acc, valueType) => {
            acc.properties = { ...acc.properties, ...valueType.properties }
            acc.required = acc.required.concat(valueType.required)
            // ? acc.required.filter((property: string) => valueType.required.includes(property))
            // : valueType.required
            return acc
          }, {
            type: 'object',
            properties: {},
            required: [],
          })
        return {
          ...objectType,
          required: [...new Set(objectType.required)],
        }
      }
      case ts.SyntaxKind.ArrayType: {
        const type: ArrayType = {
          type: 'array',
          items: this.getValueType((node as ArrayTypeNode).getElementTypeNode(), sourceFiles, propertyName) as ItemsType,
        }
        return type
      }
      case ts.SyntaxKind.TupleType: {
        const elements = (node as TupleTypeNode).getElements() || []
        const type: ArrayType = {
          type: 'array',
          items: elements[0]
            ? this.getValueType(elements[0], sourceFiles, propertyName) as ItemsType
            : { type: 'object' },
        }
        return type
      }
      case ts.SyntaxKind.UndefinedKeyword: {
        const type: AnyType = {
          type: 'object',
          $ref: ts.SyntaxKind[node.getKind()],
        }
        return type
      }

      default: {
        console.warn(`[Tracker] Unknown Type for "${propertyName}": ${ts.SyntaxKind[node.getKind()]}`)
        const type: AnyType = {
          type: 'object',
          $ref: ts.SyntaxKind[node.getKind()],
        }
        return type
      }
    }
  }

  private getObjectType(node: InterfaceDeclaration | TypeLiteralNode, sourceFiles: SourceFiles): ObjectType {
    return node.getProperties()
      .sort((propertyA, propertyB) => propertyA.getName().localeCompare(propertyB.getName()))
      .reduce<ObjectType>((prev, property) => {
        const name = property.getName()
        const schema = this.getTypeNodeSchema(property, sourceFiles) as Schema & { required: boolean }
        if (schema.required === true) {
          const { required, ...withoutRequired } = schema
          prev.required.push(name)
          prev.properties[name] = withoutRequired
        } else {
          prev.properties[name] = schema
        }
        return prev
      }, {
        type: 'object',
        required: [],
        properties: {},
      })
  }

  private getTypeNodeSchema(node: PropertySignature, sourceFiles: SourceFiles): Schema {
    const name = node.getName()
    const valueType = this.getValueType(node?.getTypeNode() as Node, sourceFiles, name)
    const tags = convertTags(getJsDocTags(node))

    if (tags.pattern && typeof valueType !== 'string' && valueType.type === 'array') {
      // @ts-expect-error
      valueType.items.pattern = tags.pattern
      tags.pattern = undefined
    }

    if (tags.ignoreUnusedProperty && typeof valueType !== 'string' && valueType.type === 'array' && valueType.items?.type === 'string') {
      valueType.items.ignoreUnusedProperty = tags.ignoreUnusedProperty
      tags.ignoreUnusedProperty = undefined
    }

    const hasUndefinedKeyword = valueType === 'null'
      || !!(valueType as EnumType)?.enum?.some(({ $ref }: any) => $ref === 'UndefinedKeyword')
    const isRequired = !node.hasQuestionToken() && !hasUndefinedKeyword
    let valueTypeValid: ValueType = (hasUndefinedKeyword && (valueType as EnumType)?.enum?.[0] || valueType) as ValueType

    if (tags.pattern && typeof valueType !== 'string') {
      valueTypeValid = { ...valueTypeValid, type: 'string' }
    }
    if (tags.integer && typeof valueType !== 'string') {
      valueTypeValid.type = 'integer'
      tags.integer = undefined
    }

    const schema: Schema = {
      ...isRequired ? { required: true } : null,
      ...tags,
      ...(typeof valueTypeValid === 'string' && valueType !== 'null')
        ? {
          type: 'string',
          enum: [valueTypeValid],
        }
        : { type: 'null' },
      ...(typeof valueTypeValid !== 'string')
        ? valueTypeValid
        : undefined,
    }
    return schema
  }

  private getTypeReferenceSchema(node: TypeReferenceNode, sourceFiles: SourceFiles, propertyName: string): ValueType {
    // https://github.com/max-team/typescript-to-json-schema/blob/master/src/util.ts#L157
    const text = node.getText()
    const name = node.getTypeName().getText()
    if (name === 'Array') {
      return {
        type: 'array',
        items: this.getValueType(node.getTypeArguments()[0], sourceFiles, propertyName) as ItemsType,
      }
    }

    const type: AnyType = {
      type: 'object',
      $ref: text,
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
  const numberAttrs = ['minItems', 'maxItems', 'minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum', 'minLength', 'maxLength']

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
