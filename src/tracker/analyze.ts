import { ObjectType, RootSchema, Schema } from '../schema'
import { Informer, Informers, Namespace, PrintReporter, PropertyResult, Reporters, TrackReport } from './'
import { AnalyzeReport } from './analyze-report'
import { getIdentifierValidator } from './validator/identifier'
import { getSchemaValidator } from './validator/schema'
import { Validator } from './validator/validator'

export type AnalyzeParams = {
  rootSchema: RootSchema
  identifierPropertyName: Namespace | undefined
  printReporter: PrintReporter
  filterProperties: (properties: PropertyResult[]) => PropertyResult[]
}

export class Analyze<T extends { [property: string]: any } = Schema> {
  objectValidatorCount = 0
  propertyValidatorCount = 0

  protected readonly rootSchema: RootSchema
  protected readonly mainSchema: ObjectType

  protected readonly printReporter: PrintReporter

  private readonly filterProperties: (properties: PropertyResult[]) => PropertyResult[]
  private readonly identifierPropertyName?: Namespace
  private readonly identifierValidator?: Validator

  protected readonly startTime: number
  #endReport?: AnalyzeReport
  #validator?: Validator

  constructor({ printReporter, filterProperties, rootSchema, identifierPropertyName }: AnalyzeParams) {
    this.startTime = Date.now()

    this.rootSchema = rootSchema
    this.mainSchema = rootSchema.definitions?.[rootSchema.$ref] as ObjectType

    this.printReporter = printReporter
    this.filterProperties = filterProperties

    this.identifierPropertyName = identifierPropertyName
    this.identifierValidator = identifierPropertyName
      ? getIdentifierValidator({
        identifierPropertyName,
        schema: this.mainSchema,
        name: this.rootSchema.$ref,
      })
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
    const propertyResults = this.validateInput(input as T)
    return this.createTrackReport(input as T, propertyResults)
  }

  protected createTrackReport(input: T | undefined, propertyResults: PropertyResult[]): TrackReport {
    const inputId = this.identifierPropertyName ? input?.[this.identifierPropertyName] : undefined
    const summaryProperties = this.filterProperties(propertyResults)
    const success = summaryProperties.length === 0

    return { inputId, success, properties: summaryProperties }
  }

  protected validateInput(input: T | undefined): PropertyResult[] {
    const namespace = '' as Namespace
    const alreadyTracked = this.identifierValidator?.validate(namespace, input) || []
    if (alreadyTracked.length) {
      return alreadyTracked
    }

    if (!this.#validator) {
      this.#validator = getSchemaValidator({
        analyze: this,
        schema: this.mainSchema,
        required: false,
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
