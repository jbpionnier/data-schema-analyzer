import { Namespace, PrintReporter, TrackReport } from './index'

export function createSimplePrintReporter(logger: (message: string) => void = console.log): PrintReporter {
  return (report: TrackReport): void => {
    const summaryProperties = report.properties
      .sort(sortPropertiesByLevel())
      .slice(0, 20)

    const inputIdString = report.inputId != null ? ` ${report.inputId}` : ''
    summaryProperties
      .map((res) => {
        const exampleString = res.example != null ? `: ${res.example}` : ''
        return `[Tracker]${inputIdString} ${res.property} ${res.description}${exampleString}`
      })
      .forEach((message) => logger(message))
  }
}

export function sortPropertiesByLevel() {
  return ({ property: propertyA }: { property: Namespace }, { property: propertyB }: { property: Namespace }) => {
    return `${propertyA.split('.').length}${propertyA}`
      .localeCompare(`${propertyB.split('.').length}${propertyB}`, 'en', { sensitivity: 'base' })
  }
}
