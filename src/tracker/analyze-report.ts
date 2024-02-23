import * as pkgInfo from '../../package.json'
import { Informer, PropertyResult } from './index'
import { sortPropertiesByLevel } from './reporter'

export class AnalyzeReport {
  readonly version = pkgInfo.version
  /**
   * Analyze start time
   */
  readonly startedAt: Date
  /**
   * Analyze end time
   */
  readonly endedAt: Date
  /**
   * Duration time in milliseconds
   */
  readonly durationTime: number
  /**
   * If all properties are OK
   */
  readonly success: boolean
  /**
   * Properties result
   */
  readonly properties: PropertyResult[]
  /**
   * Informations about the properties
   */
  readonly informations: Informer[]
  readonly metadata?: any

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
    this.informations = informations
      .map(({ infos, ...other }) => {
        return {
          ...other,
          ...Object.keys(infos || {}).length > 0 ? { infos } : {},
        }
      })
      .sort(sortPropertiesByLevel())
    this.metadata = {
      version: this.version,
      ...metadata || {},
    }
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
