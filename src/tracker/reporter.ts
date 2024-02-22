import { Logger, Namespace, PrintReporter, TrackReport } from './index'

export function createSimplePrintReporter(logger: Logger = console.log): PrintReporter {
  return async (report: TrackReport): Promise<void> => {
    const summaryProperties = report.properties
      .sort(sortPropertiesByLevel())
      .slice(0, 20)
    const inputIdString = report.inputId != null ? ` ${report.inputId}` : ''

    await Promise.all(summaryProperties.map((res) => {
      const exampleString = res.example != null ? `: ${res.example}` : ''
      const message = `[Tracker]${inputIdString} ${res.property} ${res.description}${exampleString}`
      return logger(message)
    }))
  }
}

export function sortPropertiesByLevel() {
  return ({ property: propertyA }: { property: Namespace }, { property: propertyB }: { property: Namespace }) => {
    return `${propertyA.split('.').length}${propertyA}`
      .localeCompare(`${propertyB.split('.').length}${propertyB}`, 'en', { sensitivity: 'base' })
  }
}
