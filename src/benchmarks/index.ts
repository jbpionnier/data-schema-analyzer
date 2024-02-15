// @ts-expect-error
import Benchmark from 'benchmark'

import objectBenchmarks from './object'
import realworld from './realworld'

const argv = process.argv.slice(2)
let suites: Benchmark.Suite[] = []

if (!argv.length) {
  suites = [
    ...realworld.suites,
    ...objectBenchmarks.suites,
  ]
} else {
  if (argv.includes('--realworld')) {
    suites.push(...realworld.suites)
  }
  if (argv.includes('--object')) {
    suites.push(...objectBenchmarks.suites)
  }
}

for (const suite of suites) {
  suite.run()
}
