export const CHECKS: string[]
export const CHECK_LABEL: Record<string, string>
export function expectedIds(): string[]
export function idOf(title: string): string | null
export function checkOf(title: string): 'matrix' | 'ops' | 'handoffNone' | 'handoffProgress' | null
export interface SummaryRow { id: string; tests: number; passed: number; failed: number; skipped: number; builds: string[]; data: Record<string, any>; failures: string[]; state: Record<string, string>; complete: boolean }
export interface Summary { rows: SummaryRow[]; expected: string[]; missingTargets: string[]; outOfScope: string[]; failed: SummaryRow[]; incomplete: SummaryRow[]; complete: boolean; partial: boolean }
export function summarizeReport(report: unknown, opts?: { partial?: boolean }): Summary
