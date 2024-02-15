import { ObjectType } from './schema'

export type TrackerOptions = {
  schema: ObjectType
  printReporter?: PrintReporter
  logger?: (message: string) => void
  summaryResult?: boolean
}

export type TrackReport = {
  success: boolean
  inputId?: string | number
  properties: PropertyResult[]
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
  example?: string | number
}

export type PrintReporter = (report: TrackReport) => void
