import { RootSchema, Schema } from '../schema'
import { Informer, Informers, Namespace, PrintReporter, PropertyResult, Reporters, TrackReport } from './'
import { AnalyzeReport } from './analyze-report'
import { getIdentifierValidator } from './identifier-validator'
import { getSchemaValidator, ObjectValidator } from './object-validator'
import { PropertyValidator } from './property-validator'

export type AnalyzeParams = {
  schema: RootSchema
  identifierPropertyName: Namespace | undefined
  printReporter: PrintReporter
  filterProperties: (properties: PropertyResult[]) => PropertyResult[]
}

export class Analyze<T extends { [property: string]: any } = Schema> {
  objectValidatorCount = 0
  propertyValidatorCount = 0

  protected readonly schema: RootSchema
  protected readonly printReporter: PrintReporter

  private readonly filterProperties: (properties: PropertyResult[]) => PropertyResult[]
  private readonly identifierPropertyName?: Namespace
  private readonly identifierValidator?: PropertyValidator

  protected readonly startTime: number
  #endReport?: AnalyzeReport
  #validator?: ObjectValidator

  constructor({ printReporter, filterProperties, schema, identifierPropertyName }: AnalyzeParams) {
    this.startTime = Date.now()

    this.schema = schema
    this.printReporter = printReporter
    this.filterProperties = filterProperties

    this.identifierPropertyName = identifierPropertyName
    this.identifierValidator = identifierPropertyName
      ? getIdentifierValidator({ identifierPropertyName, schema })
      : undefined
  }

  endAndPrint(): void {
    const report = this.end()
    this.printReporter(report)
  }

  end(): AnalyzeReport {
    if (!this.#endReport) {
      this.#endReport = this.#generateReport()
    }
    return this.#endReport
  }

  #generateReport(): AnalyzeReport {
    const endTime = Date.now()
    return new AnalyzeReport({
      startTime: this.startTime,
      endTime,
    })
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
    return this.createTrackReport(input, propertyResults)
  }

  protected createTrackReport(input: T | null | undefined, propertyResults: PropertyResult[]): TrackReport {
    const inputId = this.identifierPropertyName ? input?.[this.identifierPropertyName] : undefined
    const summaryProperties = this.filterProperties(propertyResults)
    const success = summaryProperties.length === 0

    return { inputId, success, properties: summaryProperties }
  }

  protected validateInput(input: T | null | undefined): PropertyResult[] {
    const namespace = '' as Namespace
    const alreadyTracked = this.identifierValidator?.validate(namespace, input)
    if (alreadyTracked) {
      return [alreadyTracked]
    }

    if (!this.#validator) {
      this.#validator = getSchemaValidator({
        analyze: this,
        schema: this.schema,
      })
    }

    return this.#validator.validate(namespace, input)
  }
}

export class AnalyzeAndInpect<T extends { [property: string]: any } = Schema> extends Analyze<T> {
  readonly infoValues: boolean

  private readonly reporters: Reporters = []
  private readonly informers: Informers = []

  #endReport: AnalyzeReport | undefined

  constructor({ infoValues, ...options }: AnalyzeParams & { infoValues?: boolean }) {
    super(options)
    this.infoValues = !!infoValues
  }

  end(): AnalyzeReport {
    if (!this.#endReport) {
      this.#endReport = this.#generateReport()
    }
    return this.#endReport
  }

  #generateReport(): AnalyzeReport {
    const endTime = Date.now()

    const properties = this.reporters.flatMap((reporter) => reporter())
    const informations = this.informers.flatMap((informer) => informer())

    return new AnalyzeReport({
      metadata: {
        objectValidatorCount: this.objectValidatorCount,
        propertyValidatorCount: this.propertyValidatorCount,
      },
      startTime: this.startTime,
      endTime,
      properties,
      informations,
    })
  }

  report(reporter: () => PropertyResult[]): void {
    this.reporters.push(reporter)
  }

  inform(informer: () => Informer[]): void {
    this.informers.push(informer)
  }
}
