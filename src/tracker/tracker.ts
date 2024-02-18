import { getIdentifierPropertyName, RootSchema } from '../schema'
import { PrintReporter, PropertyResult, Reporters, TrackerOptions, TrackReport } from './index'
import { createSimplePrintReporter } from './reporter'
import { PropertyValidator } from './validator'
import { getObjectValidator } from './validators/base'
import { getIdentifierValidator } from './validators/object'

export class Tracker<T extends { [property: string]: any }> {
  readonly schema: RootSchema
  private readonly printReporter: PrintReporter
  private readonly identifierPropertyName: string | undefined

  private summaryResult?: Set<string>
  private identifierValidator?: PropertyValidator
  private reporting?: Reporters

  constructor({ schema, summaryResult, printReporter, logger }: TrackerOptions) {
    if (!schema) {
      throw new Error('schema is required')
    }
    this.schema = schema
    this.printReporter = printReporter || createSimplePrintReporter(logger)
    this.identifierPropertyName = getIdentifierPropertyName(schema)

    this.summaryResult = summaryResult ? new Set<string>() : undefined
    this.identifierValidator = getIdentifierValidator(this.identifierPropertyName, schema)
  }

  analyzeStart({ inspectValues = true }: { inspectValues?: boolean } = {}): void {
    this.summaryResult = this.summaryResult ? new Set<string>() : undefined
    this.identifierValidator = getIdentifierValidator(this.identifierPropertyName, this.schema)
    this.reporting = inspectValues ? [] : undefined
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
    if (!this.reporting) {
      return { success: true, properties: [] }
    }

    const properties = this.reporting
      .map((reporter) => reporter())
      .filter((item): item is PropertyResult => item != null)

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
    const propertyResults = this.validateInput(input)
    const summaryProperties = this.filterSummaryResults(propertyResults)

    const inputId = this.identifierPropertyName ? input?.[this.identifierPropertyName] : undefined
    const success = summaryProperties.length === 0
    return { success, inputId, properties: summaryProperties }
  }

  private filterSummaryResults(properties: PropertyResult[]): PropertyResult[] {
    if (!this.summaryResult) {
      return properties
    }

    return properties.filter((item) => {
      const resultKey = `${item.property}_${item.type}`
      if (this.summaryResult!.has(resultKey)) {
        return false
      }
      this.summaryResult!.add(resultKey)
      return true
    })
  }

  private validateInput(input: T | null | undefined): PropertyResult[] {
    const alreadyTracked = this.identifierValidator?.validate(input)
    if (alreadyTracked) {
      return [alreadyTracked]
    }
    const validator = getObjectValidator({ namespace: '', schema: this.schema, reporting: this.reporting })
    return validator.validate(input)
  }
}
