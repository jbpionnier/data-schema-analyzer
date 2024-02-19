import { ObjectType, RootSchema, StringType } from '../schema'
import { Analyze, AnalyzeAndInpect, AnalyzeOptions } from './analyze'
import { Namespace, PrintReporter, PropertyResult, TrackerOptions } from './index'
import { createSimplePrintReporter } from './reporter'

export class Tracker<T extends { [property: string]: any }> {
  readonly schema: RootSchema
  private readonly identifierPropertyName: Namespace | undefined
  private readonly printReporter: PrintReporter
  private readonly summaryResult: boolean

  constructor({ schema, summaryResult, printReporter, logger }: TrackerOptions) {
    if (!schema) {
      throw new Error('schema is required')
    }
    this.schema = schema
    this.identifierPropertyName = getIdentifierPropertyName(schema)
    this.printReporter = printReporter || createSimplePrintReporter(logger)
    this.summaryResult = !!summaryResult
  }

  analyze({ inspectValues = true }: { inspectValues?: boolean } = {}): Analyze<T> {
    const filterProperties = this.summaryResult
      ? filterSummaryResults()
      : (properties: PropertyResult[]) => properties

    const options: AnalyzeOptions = {
      printReporter: this.printReporter,
      identifierPropertyName: this.identifierPropertyName,
      filterProperties,
      schema: this.schema,
    }

    return inspectValues
      ? new AnalyzeAndInpect(options)
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
  // @ts-expect-error
  const [identifierPropertyName] = Object.entries<StringType>(schema.properties)
    .find(([_propertyName, property]) => property.id === true) || []
  return identifierPropertyName as Namespace
}
