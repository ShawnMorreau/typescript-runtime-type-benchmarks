import { type } from '../src/type';
import { createCase } from '../benchmarks';

createCase('arktype', 'parseSafe', () => {
  const dataType = type({
    number: 'number',
    negNumber: 'number',
    maxNumber: 'bigint',
    string: 'string',
    longString: 'string',
    boolean: 'boolean',
    deeplyNested: {
      foo: 'string',
      num: 'number',
      bool: 'boolean',
    },
  });

  const {data} = dataType.check({"unknown": 2})
  
  return input => {
    return dataType.check(input).data
  };
});
// createCase('arktype', 'parseStrict', () => {
//   const dataType = type({
//     number: 'number',
//     negNumber: 'number',
//     maxNumber: 'bigint',
//     string: 'string',
//     longString: 'string',
//     boolean: 'boolean',
//     deeplyNested: {
//       foo: 'string',
//       num: 'number',
//       bool: 'boolean',
//     },
//   });

//   return input => {
//     const { data } = dataType.check(input);
//     return data;
//   };
// });
// createCase('arktype', 'assertLoose', () => {
//   const dataType = type({
//     number: 'number',
//     negNumber: 'number',
//     maxNumber: 'bigint',
//     string: 'string',
//     longString: 'string',
//     boolean: 'boolean',
//     deeplyNested: {
//       foo: 'string',
//       num: 'number',
//       bool: 'boolean',
//     },
//   });

//   return input => {
//     const { data } = dataType.check(input);
//     return data;
//   };
// });
// createCase('arktype', 'assertStrict', () => {
//   const dataType = type({
//     number: 'number',
//     negNumber: 'number',
//     maxNumber: 'bigint',
//     string: 'string',
//     longString: 'string',
//     boolean: 'boolean',
//     deeplyNested: {
//       foo: 'string',
//       num: 'number',
//       bool: 'boolean',
//     },
//   });

//   return input => {
//     const { data } = dataType.check(input);
//     return data;
//   };
// });
