import { Analyze, Schema, Tracker } from '../index'

export function createAnalyze<T extends { [key: string]: any }>(
  properties: { [property: string]: Schema },
  options: { summaryResult?: true } = {},
): Analyze<T> {
  const tracker = new Tracker<T>({
    schema: { type: 'object', properties } as any,
    ...options,
  })

  return tracker.analyze()
}
