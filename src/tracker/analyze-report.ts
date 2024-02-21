import { Informer, PropertyResult } from './index'

export class AnalyzeReport {
  readonly startedAt: Date
  readonly endedAt: Date
  readonly durationTime: number

  readonly success: boolean
  readonly properties: PropertyResult[]
  readonly informations: Informer[]

  constructor({ startTime, endTime, properties = [], informations = [] }: {
    startTime: number
    endTime: number
    properties?: PropertyResult[]
    informations?: Informer[]
  }) {
    this.startedAt = new Date(startTime)
    this.endedAt = new Date(endTime)
    this.durationTime = endTime - startTime

    this.success = properties.length === 0
    this.properties = properties
    this.informations = informations
  }

  toJSON(): object {
    return {
      durationTime: this.durationTime,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      success: this.success,
      properties: this.properties,
      informations: this.informations,
    }
  }
}
