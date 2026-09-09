const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/;

export function cardYear(name: string): string {
  return YEAR_PATTERN.exec(name)?.[0] ?? "—";
}

export function cardGradeLabel(grader?: string, grade?: string): string {
  return grader && grade ? `${grader} ${grade}` : "Ungraded";
}
