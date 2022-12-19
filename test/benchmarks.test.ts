import { getRegisteredBenchmarks } from '../benchmarks';
import { cases } from '../cases';

// all cases need to be imported here because jest cannot pic up dynamically
// imported `test` and `describe`

import "../cases/arktype"
import '../cases/yup';
import '../cases/zod';

test('all cases must have been imported in tests', () => {
  expect(
    new Set<string>(
      getRegisteredBenchmarks().flatMap(pair =>
        pair[1].map(b => b.moduleName.split(' ')[0])
      )
    ).size
  ).toBe(cases.length);
});

getRegisteredBenchmarks().forEach(([benchmarkId, benchmarkCases]) => {
  describe(benchmarkId, () => {
    benchmarkCases.forEach(c => c.test());
  });
});
