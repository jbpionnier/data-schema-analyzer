import { ObjectType, RootSchema } from '../schema'
import { Analyze, AnalyzeAndInpect, AnalyzeParams } from './analyze'
import { AnalyzeOptions, Namespace, PrintReporter, PropertyResult, TrackerOptions } from './index'
import { createSimplePrintReporter } from './reporter'

export class Tracker<T extends { [property: string]: any }> {
  readonly rootSchema: RootSchema

  private readonly identifierPropertyName: Namespace | undefined
  private readonly printReporter: PrintReporter
  private readonly summaryResult: boolean

  constructor({ schema, summaryResult, printReporter, logger }: TrackerOptions) {
    if (!schema) {
      throw new Error('schema is required')
    }
    this.rootSchema = schema

    const mainSchema = schema?.definitions?.[schema.$ref] as ObjectType
    if (!schema.$ref || !mainSchema) {
      throw new Error(`Schema ${schema.$ref || '$ref'} not found`)
    }
    this.identifierPropertyName = getIdentifierPropertyName(mainSchema)
    this.printReporter = printReporter || createSimplePrintReporter(logger)
    this.summaryResult = !!summaryResult
  }

  analyze({ inspectValues = true, infoValues }: AnalyzeOptions = {}): Analyze<T> {
    const filterProperties = this.summaryResult
      ? filterSummaryResults()
      : (properties: PropertyResult[]) => properties

    const options: AnalyzeParams = {
      printReporter: this.printReporter,
      identifierPropertyName: this.identifierPropertyName,
      rootSchema: this.rootSchema,
      filterProperties,
    }

    return inspectValues
      ? new AnalyzeAndInpect({ ...options, infoValues })
      : new Analyze(options)
  }
}

function filterSummaryResults(): (properties: PropertyResult[]) => PropertyResult[] {
  const summaryResult = new Set<string>()

  return (properties: PropertyResult[]): PropertyResult[] => {
    return properties.filter((item) => {
      const resultKey = `${item.property}_${item.type}`
      if (summaryResult!.has(resultKey)) {
        return false
      }
      summaryResult!.add(resultKey)
      return true
    })
  }
}

function getIdentifierPropertyName(schema: ObjectType): Namespace | undefined {
  if ('properties' in schema) {
    const [identifierPropertyName] = Object.entries<any>(schema?.properties || {})
      .find(([_propertyName, property]) => property.id === true) || []
    return identifierPropertyName as Namespace
  }
}
