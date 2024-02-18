import { RootSchema } from '../schema'

export type TrackerOptions = {
  /**
   * The schema to track
   */
  schema: RootSchema
  /**
   * If true, the tracker will return only one report by property
   */
  summaryResult?: boolean
  /**
   * A function to log messages
   * @param message
   */
  logger?: (message: string) => void
  printReporter?: PrintReporter
}

export type PropertyResult = {
  property: string
  type:
    | 'OK'
    | 'ALREADY_TRACKED'
    | 'UNKNOWN_TYPE'
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
  example?: unknown
}

export type PropertyValidation = Array<(input: any) => PropertyResult | undefined | void>

export type PropertiesValidation = Array<(input: any) => PropertyResult[] | undefined | void>

export type Reporters = Array<() => PropertyResult | undefined | void>

export type TrackReport = {
  success: boolean
  inputId?: string | number
  properties: PropertyResult[]
}

export type PrintReporter = (report: TrackReport) => void

export function getInputType(input: any): string {
  return Array.isArray(input) ? 'array' : typeof input
}
