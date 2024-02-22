import { Informer, PropertyResult } from './index'

export class AnalyzeReport {
  readonly startedAt: Date
  readonly endedAt: Date
  readonly durationTime: number

  readonly success: boolean
  readonly properties: PropertyResult[]
  readonly informations: Informer[]
  readonly metadata?: object

  constructor({ startTime, endTime, properties = [], informations = [], metadata }: {
    startTime: number
    endTime: number
    properties?: PropertyResult[]
    informations?: Informer[]
    metadata?: object
  }) {
    this.startedAt = new Date(startTime)
    this.endedAt = new Date(endTime)
    this.durationTime = endTime - startTime

    this.success = properties.length === 0
    this.properties = properties
    this.informations = informations.map(({ infos, ...other }) => {
      return {
        ...other,
        ...Object.keys(infos || {}).length > 0 ? { infos } : {},
      }
    })
    this.metadata = metadata
  }

  toJSON(): object {
    return {
      metadata: this.metadata,
      durationTime: this.durationTime,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      success: this.success,
      properties: this.properties,
      informations: this.informations,
    }
  }
}
