import { RootSchema, Schema, TypeName } from '../schema'

export { Analyze } from './analyze'
export { AnalyzeReport } from './analyze-report'
export { Tracker } from './tracker'

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
  logger?: Logger
  printReporter?: PrintReporter
}

export type AnalyzeOptions = {
  inspectValues?: boolean
  infoValues?: boolean
}

export type Namespace = `${string}.${string}`

export type PropertyResult = {
  property: Namespace
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
    | 'INTEGER'
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

export type Informer = {
  property: Namespace
  type: TypeName
  stats: {
    count: number
  }
  infos?: Partial<Schema>
}

export type Reporters = Array<() => PropertyResult[]>
export type Informers = Array<() => Informer[]>

export type TrackReport = {
  success: boolean
  inputId?: string | number
  properties: PropertyResult[]
}

export type PrintReporter = (report: TrackReport) => void | Promise<void>
export type Logger = (message: string) => void | Promise<void>
