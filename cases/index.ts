// export const cases = ['arktype', 'yup', 'zod'] as const;
export const cases = ['arktype', 'yup', 'zod'] as const;

export type CaseName = typeof cases[number];

export async function importCase(caseName: CaseName) {
await import('./' + caseName);
}