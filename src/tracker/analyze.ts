import { RootSchema } from '../schema'
import { PrintReporter, PropertyResult, Reporters, TrackReport } from './index'
import { PropertyValidator } from './validator'
import { getObjectValidator } from './validators/base'
import { getIdentifierValidator } from './validators/object'

export type AnalyzeOptions = {
  schema: RootSchema
  identifierPropertyName: string | undefined
  printReporter: PrintReporter
  filterProperties: (properties: PropertyResult[]) => PropertyResult[]
}

export class Analyze<T extends { [property: string]: any }> {
  private readonly schema: RootSchema
  private readonly printReporter: PrintReporter
  private readonly filterProperties: (properties: PropertyResult[]) => PropertyResult[]
  private readonly identifierPropertyName?: string
  private readonly identifierValidator?: PropertyValidator

  constructor({ printReporter, filterProperties, schema, identifierPropertyName }: AnalyzeOptions) {
    this.schema = schema
    this.printReporter = printReporter
    this.filterProperties = filterProperties

    this.identifierPropertyName = identifierPropertyName
    this.identifierValidator = identifierPropertyName
      ? getIdentifierValidator(identifierPropertyName, schema)
      : undefined
  }

  endAndPrint(): void {
    const report = this.end()
    this.printReporter(report)
  }

  end(): TrackReport {
    return { success: true, properties: [] }
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
    const propertyResults = this.validateInput(input, undefined)
    return this.createTrackReport(input, propertyResults)
  }

  protected createTrackReport(input: T | null | undefined, propertyResults: PropertyResult[]): TrackReport {
    const inputId = this.identifierPropertyName ? input?.[this.identifierPropertyName] : undefined
    const summaryProperties = this.filterProperties(propertyResults)
    const success = summaryProperties.length === 0

    return { inputId, success, properties: summaryProperties }
  }

  protected validateInput(input: T | null | undefined, reporting?: Reporters): PropertyResult[] {
    const alreadyTracked = this.identifierValidator?.validate(input)
    if (alreadyTracked) {
      return [alreadyTracked]
    }
    const validator = getObjectValidator({ namespace: '', schema: this.schema, reporting })
    return validator.validate(input)
  }
}

export class AnalyzeAndInpect<T extends { [property: string]: any }> extends Analyze<T> {
  private readonly reporting: Reporters = []

  track(input: T | null | undefined): TrackReport {
    const propertyResults = this.validateInput(input, this.reporting)
    return this.createTrackReport(input, propertyResults)
  }

  end(): TrackReport {
    const properties = this.reporting
      .map((reporter) => reporter())
      .filter((item): item is PropertyResult => item != null)

    return { success: properties.length === 0, properties }
  }
}
