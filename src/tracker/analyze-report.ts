import * as pkgInfo from '../../package.json'
import { Informer, PropertyResult } from './index'
import { sortPropertiesByLevel } from './reporter'

export type AnalyzeReport = {
  /**
   * Analysis time information
   */
  timeInfo: TimeInfo
  /**
   * If all properties are OK
   */
  success: boolean
  /**
   * Properties result
   */
  properties: PropertyResult[]
  /**
   * Informations about the properties
   */
  informations: Informer[]
  metadata?: any
}

export type TimeInfo = {
  /**
   * Analyze start time
   */
  startedAt: Date
  /**
   * Analyze end time
   */
  endedAt: Date
  /**
   * Duration of the analyze in milliseconds
   */
  analyzeDuration: number
  /**
   * Duration of the track in milliseconds
   */
  trackDuration: number
  /**
   * Percentage of the track time in the analyze time
   */
  trackTimePercentage: number
}

export function createAnalyzeReport({ startAnalyzeTime, endAnalyzeTime, trackDuration, properties = [], informations = [], metadata }: {
  startAnalyzeTime: number
  endAnalyzeTime: number
  trackDuration: number
  properties?: PropertyResult[]
  informations?: Informer[]
  metadata?: {
    total: number
    objectValidatorCount: number
    propertyValidatorCount: number
    informations: number
  }
}): AnalyzeReport {
  const informationsFormatted = informations
    .map(({ infos, ...other }) => {
      return {
        ...other,
        ...Object.keys(infos || {}).length > 0 ? { infos } : {},
      }
    })
    .sort(sortPropertiesByLevel())
  const analyzeDuration = endAnalyzeTime - startAnalyzeTime

  const timeInfo: TimeInfo = {
    startedAt: new Date(startAnalyzeTime),
    endedAt: new Date(endAnalyzeTime),
    analyzeDuration,
    trackDuration,
    trackTimePercentage: (trackDuration / analyzeDuration) * 100,
  }

  const report: AnalyzeReport = {
    timeInfo,
    success: properties.length === 0,
    properties,
    informations: informationsFormatted,
    metadata: {
      version: pkgInfo.version,
      ...metadata || {},
    },
  }
  return report
}
