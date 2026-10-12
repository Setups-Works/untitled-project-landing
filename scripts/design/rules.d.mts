export type Violation = { file: string; line: number; id: string; message: string; text: string };
export const RULES: { id: string; files: RegExp[]; re: RegExp; message: string; skipLine?: RegExp; skipFile?: RegExp }[];
export function checkLines(file: string, lines: { n: number; text: string }[], allLines?: string[]): Violation[];
