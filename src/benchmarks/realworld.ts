// @ts-expect-error
import Benchmark from 'benchmark'
import { createAnalyze } from './shared'

const shortSuite = new Benchmark.Suite('realworld')

const analyze = createAnalyze({
  type: { type: 'string', enum: ['person'] },
  hair: { type: 'string', enum: ['blue', 'brown'] },
  active: { type: 'boolean' },
  name: { type: 'string' },
  age: { type: 'number', minimum: 0, maximum: 2000 },
  hobbies: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        type: { type: 'string' },
      },
    },
  },
  address: {
    type: 'object',
    properties: {
      street: { type: 'string' },
      zip: { type: 'string' },
      country: { type: 'string' },
    },
  },
})

let i = 0

function num(): number {
  return ++i
}

function str(): string {
  return (++i % 100).toString(16)
}

function array<T>(fn: () => T): T[] {
  return Array.from({ length: ++i % 10 }, () => fn())
}

const peoples = Array.from({ length: 100 }, () => {
  return {
    type: 'person',
    hair: i % 2 ? 'blue' : 'brown',
    active: !!(i % 2),
    name: str(),
    age: num(),
    hobbies: array(() => ({ type: str(), id: num() })),
    address: {
      street: str(),
      zip: str(),
      country: str(),
    },
  }
})

shortSuite
  .add('valid', () => {
    peoples.forEach((people) => {
      try {
        const report = analyze.track(people)
        if (!report.success) {
          throw new Error('Invalid')
        }
      } catch (err) {
        console.error(err)
      }
    })
  })
  .on('cycle', (e: Benchmark.Event) => {
    console.log(`${(shortSuite as any).name}: ${e.target}`)
  })

export default {
  suites: [shortSuite],
}
