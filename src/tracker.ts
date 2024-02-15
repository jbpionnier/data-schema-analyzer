import { EnumType, IdentifierProperty, RootSchema, Schema, StringType } from './schema'
import { PrintReporter, PropertyResult, TrackerOptions, TrackReport } from './types'

export class Tracker<T extends { [property: string]: any }> {
  readonly schema: RootSchema

  private readonly printReporter: PrintReporter
  private readonly summaryResult?: Set<string>

  private trackIdProcessor?: TrackIdProcessor

  private propertiesOptional?: Map<string, { notNull?: boolean; isNull?: boolean }>
  private propertiesRequired?: Map<string, Set<any>>
  private enumValues?: Map<string, { values: Array<string | number>; used: Set<string | number> }>

  constructor({ schema, printReporter, logger, summaryResult }: TrackerOptions) {
    if (!schema) {
      throw new Error('schema is required')
    }
    this.schema = schema
    this.printReporter = printReporter || createSimplePrintReporter(logger)
    this.summaryResult = summaryResult ? new Set<string>() : undefined
    this.trackIdProcessor = TrackIdProcessor.from(schema)
  }

  analyzeStart({ inspectData }: { inspectData?: boolean } = {}): void {
    this.trackIdProcessor = TrackIdProcessor.from(this.schema)
    this.propertiesOptional = inspectData ? new Map<string, { notNull?: boolean; isNull?: boolean }>() : undefined
    this.propertiesRequired = inspectData ? new Map<string, Set<any>>() : undefined
    this.enumValues = inspectData ? new Map<string, { values: Array<string | number>; used: Set<string | number> }>() : undefined
  }

  analyzeEndAsync(): Promise<TrackReport> {
    const result = this.analyzeEnd()
    return Promise.resolve(result)
  }

  analyzeEndAndPrint(): void {
    const report = this.analyzeEnd()
    this.printReporter(report)
  }

  analyzeEnd(): TrackReport {
    if (!this.propertiesOptional) {
      return { success: true, properties: [] }
    }

    const propertiesOptional = Array.from(this.propertiesOptional)
    const propertiesAlwaysPresent = propertiesOptional
      .filter(([_property, value]) => !value.isNull)
      .map(([property]): PropertyResult => ({
        property,
        type: 'ALWAYS_PRESENT',
        description: 'optional property always present',
      }))

    const propertiesNeverUsed = propertiesOptional
      .filter(([_property, value]) => !value.notNull)
      .map(([property]): PropertyResult => ({
        property,
        type: 'NEVER_USED',
        description: 'optional property never used',
      }))

    const propertiesSingleValue = Array.from(this.propertiesRequired!)
      .filter(([_property, valuesSet]) => valuesSet.size === 1)
      .map(([property, valuesSet]): PropertyResult => ({
        property,
        type: 'SINGLE_VALUE',
        description: 'property always have the same single value',
        example: valuesSet.keys().next().value,
      }))

    const propertiesEnumValuesUsed = Array.from(this.enumValues!)
      .filter(([_property, { values, used }]) => values.some((value) => !used.has(value.toString())))
      .map(([property, { used }]): PropertyResult => {
        return {
          property,
          type: 'ENUM_VALUES',
          description: 'values used',
          example: Array.from(used).sort().join("' | '"),
        }
      })

    const properties = [
      ...propertiesAlwaysPresent,
      ...propertiesNeverUsed,
      ...propertiesSingleValue,
      ...propertiesEnumValuesUsed,
    ]
    return { success: properties.length === 0, properties }
  }

  trackAsync(input: T): Promise<TrackReport> {
    const result = this.track(input)
    return Promise.resolve(result)
  }

  trackAndPrint(input: T): void {
    const report = this.track(input)
    this.printReporter(report)
  }

  track(input: T | null | undefined): TrackReport {
    const inputId = this.schema.identifierProperty ? input?.[this.schema.identifierProperty] : undefined
    const alreadyTracked = this.trackIdProcessor?.process(inputId) || []

    const processedProperties = alreadyTracked.length
      ? alreadyTracked
      : this.processProperties({
        input,
        schema: this.schema,
        namespace: '',
      })

    const success = processedProperties.length === 0
    if (!this.summaryResult) {
      return { success, inputId, properties: processedProperties }
    }

    const summaryProperties = processedProperties
      .filter((item) => {
        const resultKey = `${item.property}_${item.type}`
        if (this.summaryResult!.has(resultKey)) {
          return false
        }
        this.summaryResult!.add(resultKey)
        return true
      })

    return { success, inputId, properties: summaryProperties }
  }

  private processProperties({ input, schema, namespace }: {
    input: unknown
    schema: Schema & {
      // For runtime optimization
      simpleRequiredType?: boolean
      propertiesList?: string[]
    }
    namespace: string
  }): PropertyResult[] {
    if (schema == null) {
      return [{
        property: namespace,
        type: 'UNKNOWN',
        description: 'unknown property',
        example: input,
      }]
    }

    const inputIsNull = input == null
    if (schema.required && inputIsNull) {
      const hasEnumValues = 'items' in schema && 'values' in schema.items && Array.isArray(schema.items?.values)
      return [{
        property: namespace,
        type: 'REQUIRED',
        description: 'required property is missing',
        example: hasEnumValues ? `[${(schema.items as EnumType)?.values?.join(' | ')}]` : `[${schema.type}]`,
      }]
    }

    if (!schema.required && !schema.ignoreUnusedProperty && !!namespace && this.propertiesOptional != null) {
      let propertyInfo = this.propertiesOptional.get(namespace)
      if (propertyInfo == null) {
        propertyInfo = {}
        this.propertiesOptional.set(namespace, propertyInfo)
      }
      propertyInfo.notNull = propertyInfo.notNull || !inputIsNull
      propertyInfo.isNull = propertyInfo.isNull || inputIsNull
    }

    if (inputIsNull) {
      return []
    }
    if (schema.simpleRequiredType == null) {
      schema.simpleRequiredType = schema.required
        && !schema.ignoreUnusedProperty
        && this.propertiesRequired != null
        && ['string', 'number', 'boolean', 'enum'].includes(schema.type)
    }

    if (schema.simpleRequiredType) {
      const propertyValues = this.propertiesRequired!.get(namespace) || new Set<any>()
      if (propertyValues.size < 2) {
        propertyValues.add(input)
        this.propertiesRequired!.set(namespace, propertyValues)
      }
    }

    if ('properties' in schema) {
      schema.propertiesList = schema.propertiesList || Object.keys(schema.properties)
      const propertiesFullList = new Set<string>(schema.propertiesList.concat(Object.keys(input)))
      return Array.from(propertiesFullList)
        .flatMap<PropertyResult>((property) => {
          const keyNamespace = namespace ? `${namespace}.${property}` : property
          return this.processProperties({
            schema: schema.properties[property],
            input: (input as any)[property],
            namespace: keyNamespace,
          })
        })
        .filter((item) => item.type !== 'OK')
    }

    const inputResult = this.checkProperty({
      schema,
      input,
      namespace,
    })

    const isInputArray = Array.isArray(input)
    const itemsInSchema = 'items' in schema
    const itemsWithProperties = itemsInSchema && 'properties' in schema.items

    if (itemsWithProperties && isInputArray) {
      const itemsResult = input
        .flatMap((value: any) => {
          return this.processProperties({
            schema: schema.required ? { ...schema.items, required: true } : schema.items,
            input: value,
            namespace,
          })
        })

      return [inputResult].concat(itemsResult)
    }

    if (itemsInSchema && isInputArray) {
      const itemsResult = input
        .map((value: any) => {
          return this.checkProperty({
            schema: schema.items,
            input: value,
            namespace,
          })
        })
      return [inputResult].concat(itemsResult)
    }

    return [inputResult]
  }

  private checkProperty({ schema, input, namespace }: {
    namespace: string
    schema: Schema & {
      // For runtime optimization
      patternRegExp?: RegExp
    }
    input: any
  }): PropertyResult {
    const resultOk: PropertyResult = { property: namespace, description: 'property ok', type: 'OK' }
    if (input == null) {
      return resultOk
    }
    const isStringOrNumber = typeof input === 'string' || typeof input === 'number'
    switch (schema.type) {
      case 'string': {
        if (typeof input !== schema.type) {
          return {
            property: namespace,
            type: 'TYPE',
            description: `property type is not ${schema.type}`,
            example: JSON.stringify(input),
          }
        }
        const valueLength = input?.toString().length
        if (schema.minLength != null && valueLength < schema.minLength) {
          return {
            property: namespace,
            type: 'MIN_LENGTH',
            description: `property length is too short (${schema.minLength} minimum)`,
            example: `"${input}" (${valueLength})`,
          }
        }
        if (schema.maxLength != null && valueLength > schema.maxLength) {
          return {
            property: namespace,
            type: 'MAX_LENGTH',
            description: `property length is too long (${schema.maxLength} maximum)`,
            example: `"${input}" (${valueLength})`,
          }
        }
        if (schema.pattern && schema.type === 'string' && !schema.patternRegExp) {
          schema.patternRegExp = new RegExp(schema.pattern)
        }
        if (schema.patternRegExp && !schema.patternRegExp!.test(input)) {
          return {
            property: namespace,
            type: 'PATTERN',
            description: `property value not match pattern ${schema.pattern}`,
            example: input,
          }
        }
        return resultOk
      }
      case 'boolean': {
        if (typeof input !== schema.type) {
          return {
            property: namespace,
            type: 'TYPE',
            description: `property type is not ${schema.type}`,
            example: JSON.stringify(input),
          }
        }
        return resultOk
      }
      case 'number': {
        if (typeof input !== schema.type) {
          return {
            property: namespace,
            type: 'TYPE',
            description: `property type is not ${schema.type}`,
            example: JSON.stringify(input),
          }
        }
        if (schema.minimum != null && schema.type === 'number' && input < schema.minimum) {
          return {
            property: namespace,
            type: 'MINIMUM',
            description: `property value is too low (${schema.minimum} minimum)`,
            example: input,
          }
        }
        if (schema.maximum != null && schema.type === 'number' && input > schema.maximum) {
          return {
            property: namespace,
            type: 'MAXIMUM',
            description: `property value is too high (${schema.maximum} maximum)`,
            example: input,
          }
        }
        return resultOk
      }
      case 'enum': {
        if (!schema.ignoreUnusedValues && this.enumValues && isStringOrNumber) {
          let enumValues = this.enumValues.get(namespace)
          // eslint-disable-next-line max-depth
          if (enumValues == null) {
            enumValues = { values: schema.values as string[], used: new Set<string | number>() }
            this.enumValues.set(namespace, enumValues)
          }
          enumValues.used.add(input)
        }

        if (isStringOrNumber && !schema.values.includes(input as any)) {
          return {
            property: namespace,
            type: 'ENUM_UNKNOWN',
            description: `property value not in enum values [${schema.values.join(', ')}]`,
            example: input,
          }
        }
        return resultOk
      }
      case 'object': {
        // if (!('properties' in schema)) {
        //   return resultOk
        // }
        return resultOk
      }
      case 'array': {
        const valueLength = (input as any[]).length
        if (valueLength == null) {
          return resultOk
        }
        if (schema.minItems != null && valueLength < schema.minItems) {
          return {
            property: namespace,
            type: 'MIN_ITEMS',
            description: `array length is too short (${schema.minItems} minimum)`,
            example: valueLength,
          }
        }
        if (schema.maxItems != null && valueLength > schema.maxItems) {
          return {
            property: namespace,
            type: 'MAX_ITEMS',
            description: `array length is too long (${schema.maxItems} maximum)`,
            example: valueLength,
          }
        }
        return resultOk
      }
      default: {
        const typeName = Array.isArray(schema)
          ? `[${schema.map(({ type }) => type).join(' | ')}]`
          : schema.type

        return {
          property: namespace,
          type: 'UNKNOWN_TYPE',
          description: `unknown type ${typeName}`,
          example: input,
        }
      }
    }
  }
}

function createSimplePrintReporter(logger: (message: string) => void = console.log): PrintReporter {
  return (report: TrackReport): void => {
    const summaryProperties = report.properties
      .sort(({ property: propertyA }, { property: propertyB }) => {
        return `${propertyA.split('.').length}${propertyA}`
          .localeCompare(`${propertyB.split('.').length}${propertyB}`, 'en', { sensitivity: 'base' })
      })
      .slice(0, 20)

    const inputIdString = report.inputId != null ? ` ${report.inputId}` : ''
    summaryProperties
      .map((res) => {
        const exampleString = res.example ? `: ${res.example}` : ''
        return `[Tracker]${inputIdString} ${res.property} ${res.description}${exampleString}`
      })
      .forEach((message) => logger(message))
  }
}

class TrackIdProcessor {
  private readonly trackedIds = new Set<string>()
  private readonly identifierProperty: IdentifierProperty

  static from(schema: RootSchema): TrackIdProcessor | undefined {
    return schema.identifierProperty != null
      ? new TrackIdProcessor(schema)
      : undefined
  }

  private constructor(schema: RootSchema) {
    if (schema.identifierProperty == null) {
      throw new Error(`${schema.name} must have an identifier property`)
    }

    const property = schema.properties[schema.identifierProperty] as StringType
    // @ts-expect-error
    if (!property.required) {
      throw new Error(`${schema.name}.${schema.identifierProperty} property must be required`)
    }

    this.identifierProperty = { name: schema.identifierProperty, ...property }
  }

  process(inputId: string | undefined): PropertyResult[] {
    if (inputId == null || this.identifierProperty?.multiple) {
      return []
    }
    if (this.trackedIds.has(inputId)) {
      return [{
        property: this.identifierProperty.name,
        type: 'ALREADY_TRACKED',
        description: 'input already tracked',
      }]
    }
    this.trackedIds.add(inputId)
    return []
  }
}
