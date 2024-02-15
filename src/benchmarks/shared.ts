import { Schema } from '../schema'
import { Tracker } from '../tracker'

export function createTracker<T extends { [key: string]: any }>(
  properties: { [property: string]: Schema },
  options: { summaryResult?: true } = {},
): Tracker<T> {
  return new Tracker<T>({
    schema: { type: 'object', properties } as any,
    ...options,
  })
}
