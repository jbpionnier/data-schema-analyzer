import { ObjectType, Schema } from './schema'

export type PropertyResult = {
  property: string
  type:
    | 'OK'
    | 'UNKNOWN'
    | 'TYPE'
    | 'NEVER_USED'
    | 'ALWAYS_PRESENT'
    | 'SINGLE_VALUE'
    | 'ENUM_VALUES'
    | 'ENUM_UNKNOWN'
    | 'REQUIRED'
    | 'MINIMUM'
    | 'MAXIMUM'
    | 'MIN_LENGTH'
    | 'MAX_LENGTH'
    | 'MIN_ITEMS'
    | 'MAX_ITEMS'
    | 'PATTERN'
  description: string
  example?: string | number
}

export type TrackReport = {
  success: boolean
  inputId?: string | number
  properties: PropertyResult[]
}

export class Tracker<T extends { [key: string]: any }> {
  private readonly logger: (message: string) => void

  private readonly summaryResult: Set<string> | undefined
  private readonly identifierProperty?: Schema & { name: string }
  private ids: { [identifier: string]: boolean | undefined } = {}

  private propertiesOptionalList: Set<string> | undefined
  private propertiesOptionalWithoutValue: Set<string> | undefined
  private propertiesOptionalWithValue: Set<string> | undefined

  private propertiesRequiredValues: Map<string, Set<any>> | undefined

  private enumValues: Record<string, Array<string | number>> = {}
  private enumValuesUsed: Record<string, Record<string, true>> | undefined

  readonly schema: ObjectType

  constructor({ schema, logger, summaryResult }: {
    schema: ObjectType
    logger?: (message: string) => void
    summaryResult?: boolean
  }) {
    this.schema = schema
    this.logger = logger || console.log
    this.summaryResult = summaryResult ? new Set<string>() : undefined

    const identifierPropertyEntry = Object.entries(this.schema.properties)
      .find(([_propertyName, property]) => property.id === true)
    this.identifierProperty = identifierPropertyEntry ? { name: identifierPropertyEntry[0], ...identifierPropertyEntry[1] } : undefined
  }

  analyzeStart({ inspectData }: { inspectData?: boolean } = {}): void {
    this.ids = {}
    this.propertiesOptionalList = undefined
    this.propertiesOptionalWithoutValue = undefined
    this.propertiesOptionalWithValue = undefined

    this.propertiesRequiredValues = undefined

    this.enumValuesUsed = undefined

    if (inspectData) {
      this.propertiesOptionalList = new Set<string>()
      this.propertiesOptionalWithoutValue = new Set<string>()
      this.propertiesOptionalWithValue = new Set<string>()

      this.propertiesRequiredValues = new Map<string, Set<any>>()

      this.enumValues = {}
      this.enumValuesUsed = {}
    }
  }

  analyzeEndAsync(): Promise<TrackReport> {
    const result = this.analyzeEnd()
    return Promise.resolve(result)
  }

  analyzeEndAndPrint(): void {
    const report = this.analyzeEnd()
    this.printResultProperties(report)
  }

  analyzeEnd(): TrackReport {
    if (!this.propertiesOptionalList) {
      return { success: true, properties: [] }
    }

    const propertiesOptional = [...this.propertiesOptionalList]
    const propertiesAlwaysPresent = propertiesOptional
      .filter((property) => !this.propertiesOptionalWithoutValue?.has(property))
      .map((property): PropertyResult => ({
        property,
        type: 'ALWAYS_PRESENT',
        description: 'optional property always present',
      }))

    const propertiesNeverUsed = propertiesOptional
      .filter((property) => !this.propertiesOptionalWithValue?.has(property))
      .map((property): PropertyResult => ({
        property,
        type: 'NEVER_USED',
        description: 'optional property never used',
      }))

    const propertiesSingleValue = [...this.propertiesRequiredValues!]
      .filter(([_property, valuesSet]) => valuesSet.size === 1)
      .map(([property, valuesSet]): PropertyResult => ({
        property,
        type: 'SINGLE_VALUE',
        description: 'property always have the same single value',
        example: valuesSet.keys().next().value,
      }))

    const propertiesEnumValuesUsed = Object.entries(this.enumValues || {})
      .filter(([property, values]) => this.enumValuesUsed?.[property] && values.length)
      .flatMap(([property, values]): PropertyResult[] => {
        const valueNotUsed = values.filter((value) => !this.enumValuesUsed?.[property]?.[value])
        const valuesUsed = Object.keys(this.enumValuesUsed?.[property] || {})
        return valueNotUsed.length
          ? [{
            property,
            type: 'ENUM_VALUES',
            description: 'values used',
            example: valuesUsed.sort().join("' | '"),
          }]
          : []
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

    const summaryProperties = report.properties
      .sort(({ property: propertyA }, { property: propertyB }) => {
        return `${propertyA.split('.').length}${propertyA}`
          .localeCompare(`${propertyB.split('.').length}${propertyB}`, 'en', { sensitivity: 'base' })
      })
      .slice(0, 20)

    this.printResultProperties({
      ...report,
      properties: summaryProperties,
    })
  }

  track(input: T): TrackReport {
    const inputId = this.identifierProperty ? input[this.identifierProperty.name] : undefined
    if (inputId != null && !this.identifierProperty?.multiple) {
      this.checkIfAlreadyTracked(inputId)
    }

    const processedProperties = this.processProperties({
      input,
      schema: this.schema,
      namespace: '',
    })

    const summaryProperties = processedProperties
      .filter((item) => {
        if (!this.summaryResult) {
          return true
        }
        const resultKey = `${item.property}_${item.type}`
        if (this.summaryResult.has(resultKey)) {
          return false
        }
        this.summaryResult.add(resultKey)
        return true
      })

    return { success: summaryProperties.length === 0, inputId, properties: summaryProperties }
  }

  private checkIfAlreadyTracked(inputId: string): void {
    if (this.ids[inputId]) {
      this.logger(`[Tracker] ${inputId} already tracked`)
      this.ids[inputId] = false
      return
    }
    if (this.ids[inputId] === false) {
      return
    }
    this.ids[inputId] = true
  }

  private printResultProperties(report: TrackReport): void {
    const inputIdString = report.inputId != null ? ` ${report.inputId}` : ''
    report.properties
      .map((res) => {
        const exampleString = res.example ? `: ${res.example}` : ''
        return `[${res.type}]${inputIdString} ${res.property} ${res.description}${exampleString}`
      })
      .forEach((message) => this.logger(message))
  }

  private processProperties({ input, schema, namespace }: {
    input: any
    schema: Schema
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

    if (schema.required && input == null) {
      return [{
        property: namespace,
        type: 'REQUIRED',
        description: 'required property is missing',
        example: 'items' in schema && 'values' in schema.items ? `Array<${schema.items?.values?.join(' | ')}>` : `[${schema.type}]`,
      }]
    }

    if (!schema.required && !schema.ignoreUnusedProperty && !!namespace && this.propertiesOptionalList != null) {
      this.propertiesOptionalList.add(namespace)

      if (input == null) {
        this.propertiesOptionalWithoutValue?.add(namespace)
      } else {
        this.propertiesOptionalWithValue?.add(namespace)
      }
    }

    if (input == null) {
      return []
    }

    if (
      schema.required && !schema.ignoreUnusedProperty
      && this.propertiesRequiredValues != null
      && ['string', 'number', 'boolean', 'enum'].includes(schema.type)
    ) {
      const propertyValues = this.propertiesRequiredValues.get(namespace) || new Set<any>()
      if (propertyValues.size < 2) {
        propertyValues.add(input)
        this.propertiesRequiredValues.set(namespace, propertyValues)
      }
    }

    if ('properties' in schema) {
      const keysList = new Set<string>(Object.keys(schema.properties).concat(Object.keys(input)))
      return [...keysList]
        .flatMap<PropertyResult>((key) => {
          const keyNamespace = namespace ? `${namespace}.${key}` : key
          return this.processProperties({
            schema: schema.properties[key],
            input: input[key],
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

    if ('items' in schema && 'properties' in schema.items && Array.isArray(input)) {
      const itemsResult = input
        .flatMap((value: any) => {
          return this.processProperties({
            schema: { ...schema.items, required: schema.required },
            input: value,
            namespace,
          })
        })

      return [inputResult, ...itemsResult]
    }

    if ('items' in schema && Array.isArray(input)) {
      const itemsResult = input
        .map((value: any) => {
          return this.checkProperty({
            schema: schema.items,
            namespace,
            input: value,
          })
        })
      return [inputResult, ...itemsResult]
    }

    return [inputResult]
  }

  private checkProperty({ schema, input, namespace }: {
    namespace: string
    schema: Schema
    input: any
  }): PropertyResult {
    const resultOk: PropertyResult = { property: namespace, description: 'property ok', type: 'OK' }
    if (input == null) {
      return resultOk
    }

    switch (schema.type) {
      case 'string':
      case 'number':
      case 'boolean': {
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
        if (schema.pattern && typeof schema.pattern === 'string') {
          schema.pattern = new RegExp(schema.pattern)
        }
        if (schema.pattern && schema.type === 'string' && !(schema.pattern as RegExp).test(input)) {
          return {
            property: namespace,
            type: 'PATTERN',
            description: `property value not match pattern ${schema.pattern}`,
            example: input,
          }
        }
        return resultOk
      }
      case 'enum': {
        if (this.enumValuesUsed && !this.enumValues[namespace] && !schema.ignoreUnusedValues) {
          this.enumValues[namespace] = schema.values
        }

        if (this.enumValuesUsed && !this.enumValuesUsed[namespace]?.[input]) {
          this.enumValuesUsed[namespace] = this.enumValuesUsed[namespace] || {}
          this.enumValuesUsed[namespace][input] = true
        }

        if (
          (typeof input === 'string' || typeof input === 'number')
          && !schema.values.includes(input as any)
        ) {
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
        this.logger(`[Tracker] checkProperty ${namespace} unknown type ${schema.type}`)
        return resultOk
      }
    }
  }
}
