// @ts-expect-error
import Benchmark from 'benchmark'
import { createTracker } from './shared'

const emptySuite = new Benchmark.Suite('parse: empty')
const shortSuite = new Benchmark.Suite('parse: short')
const longSuite = new Benchmark.Suite('parse: long')

const empty = createTracker({})
const short = createTracker({
  string: { type: 'string' },
})
const long = createTracker({
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
})

emptySuite
  .add('valid', () => {
    empty.track({})
  })
  .add('valid: extra keys', () => {
    empty.track({ string: 'string' })
  })
  .add('invalid: null', () => {
    empty.track(null as any)
  })
  .on('cycle', (e: Benchmark.Event) => {
    console.log(`${(emptySuite as any).name}: ${e.target}`)
  })

shortSuite
  .add('valid', () => {
    short.track({ string: 'string' })
  })
  .add('valid: extra keys', () => {
    short.track({ string: 'string', number: 42 })
  })
  .add('invalid: null', () => {
    short.track(null)
  })
  .on('cycle', (e: Benchmark.Event) => {
    console.log(`${(shortSuite as any).name}: ${e.target}`)
  })

longSuite
  .add('valid', () => {
    long.track({ string: 'string', number: 42, boolean: true })
  })
  .add('valid: extra keys', () => {
    long.track({ string: 'string', number: 42, boolean: true, list: [] })
  })
  .add('invalid: null', () => {
    long.track(null)
  })
  .on('cycle', (e: Benchmark.Event) => {
    console.log(`${(longSuite as any).name}: ${e.target}`)
  })

export default {
  suites: [emptySuite, shortSuite, longSuite],
}
