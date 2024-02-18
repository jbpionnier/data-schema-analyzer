import { Schema, Tracker } from '../index'

export function createTracker<T extends { [key: string]: any }>(
  properties: { [property: string]: Schema },
  options: { summaryResult?: true } = {},
): Tracker<T> {
  return new Tracker<T>({
    schema: { type: 'object', properties } as any,
    ...options,
  })
}
