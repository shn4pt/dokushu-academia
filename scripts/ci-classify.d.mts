export function classifyFile(path: string): 'docs' | 'ci' | 'code'
export function decide(files: string[]): { fullTests: boolean; deploy: boolean; classes: string[]; reason: string }
