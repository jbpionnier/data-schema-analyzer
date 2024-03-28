import { ObjectType, RootSchema, Schema } from '../schema'
import { Informer, Informers, Namespace, PrintReporter, PropertyResult, Reporters, TrackReport } from './'
import { AnalyzeReport, createAnalyzeReport } from './analyze-report'
import { getIdentifierValidator } from './validator/identifier'
import { getSchemaValidator } from './validator/schema'
import { getInputType } from './validator/schema-type'
import { PropertyValidator, Validator } from './validator/validator'

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
  protected readonly startAnalyzeTime: number
  protected trackDuration = 0

  readonly #filterProperties: (properties: PropertyResult[]) => PropertyResult[]
  readonly #identifierPropertyName?: Namespace
  readonly #identifierValidator?: PropertyValidator

  #endReport?: AnalyzeReport
  #validator?: Validator
  #trackCount = 0

  constructor({ printReporter, filterProperties, rootSchema, identifierPropertyName }: AnalyzeParams) {
    this.startAnalyzeTime = Date.now()

    this.rootSchema = rootSchema
    this.mainSchema = rootSchema.definitions?.[rootSchema.$ref] as ObjectType

    this.printReporter = printReporter
    this.#filterProperties = filterProperties

    this.#identifierPropertyName = identifierPropertyName
    this.#identifierValidator = identifierPropertyName
      ? getIdentifierValidator({
        identifierPropertyName,
        schema: this.mainSchema,
        name: this.rootSchema.$ref,
      })
      : undefined
  }

  /**
   * End Analyze and print the report
   */
  async endAndPrint(): Promise<void> {
    const report = this.end()
    await this.printReporter(report)
  }

  /**
   * End Analyze
   */
  end(): AnalyzeReport {
    if (!this.#endReport) {
      this.#endReport = this.#generateReport()
    }
    return this.#endReport
  }

  #generateReport(): AnalyzeReport {
    return createAnalyzeReport({
      trackDuration: this.trackDuration,
      startAnalyzeTime: this.startAnalyzeTime,
      endAnalyzeTime: Date.now(),
    })
  }

  /**
   * Track the data
   * @param input
   */
  trackAsync(input: T | null | undefined): Promise<TrackReport> {
    const result = this.track(input)
    return Promise.resolve(result)
  }

  /**
   * Track the data and print the report
   * @param input
   */
  trackAndPrint(input: T | null | undefined): void {
    const report = this.track(input)
    this.printReporter(report)
  }

  /**
   * Track the data
   * @param input
   */
  track(input: T | null | undefined): TrackReport {
    this.#trackCount++

    const startTrackTime = Date.now()
    const propertyResults = this.validateInput(input as T)
    const trackReport = this.createTrackReport(input as T, propertyResults)
    this.trackDuration += Date.now() - startTrackTime
    return trackReport
  }

  /**
   * Get the number of tracks
   */
  get trackCount(): number {
    return this.#trackCount
  }

  protected createTrackReport(input: T | undefined, propertyResults: PropertyResult[]): TrackReport {
    const inputId = this.#identifierPropertyName ? input?.[this.#identifierPropertyName] : undefined
    const summaryProperties = this.#filterProperties(propertyResults)
    const success = summaryProperties.length === 0

    return { inputId, success, properties: summaryProperties }
  }

  protected validateInput(input: T | undefined): PropertyResult[] {
    const namespace = '' as Namespace
    const inputType = getInputType(input)
    const alreadyTracked = this.#identifierValidator?.validateInput(namespace, input, inputType) || []
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

    return this.#validator.validateInput(namespace, input, inputType)
  }
}

export class AnalyzeAndInpect<T extends { [property: string]: any } = Schema> extends Analyze<T> {
  readonly infoValues: boolean

  readonly #reporters: Reporters = []
  readonly #informers: Informers = []

  #endReport: AnalyzeReport | undefined

  constructor({ infoValues, ...options }: AnalyzeParams & { infoValues?: boolean }) {
    super(options)
    this.infoValues = !!infoValues
  }

  /**
   * Add a reporter
   * @param reporter
   */
  report(reporter: (propertiesResult: PropertyResult[]) => void): void {
    this.#reporters.push(reporter)
  }

  /**
   * Add an informer
   * @param informer
   */
  inform(informer: (informers: Informer[]) => void): void {
    this.#informers.push(informer)
  }

  end(): AnalyzeReport {
    if (!this.#endReport) {
      this.#endReport = this.#generateReport()
    }
    return this.#endReport
  }

  #generateReport(): AnalyzeReport {
    const endAnalyzeTime = Date.now()
    const properties = this.#getPropertiesResult()
    const informations = this.#getInformations()

    return createAnalyzeReport({
      metadata: {
        total: this.trackCount,
        objectValidatorCount: this.objectValidatorCount,
        propertyValidatorCount: this.propertyValidatorCount,
        informations: informations.length,
      },
      trackDuration: this.trackDuration,
      startAnalyzeTime: this.startAnalyzeTime,
      endAnalyzeTime,
      properties,
      informations,
    })
  }

  #getPropertiesResult(): PropertyResult[] {
    const propertiesResult: PropertyResult[] = []
    for (const reporter of this.#reporters) {
      reporter(propertiesResult)
    }
    return propertiesResult
  }

  #getInformations(): Informer[] {
    const informations: Informer[] = []
    for (const informer of this.#informers) {
      informer(informations)
    }
    return informations
  }
}
