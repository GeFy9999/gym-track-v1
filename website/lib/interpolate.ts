// Dictionary strings use {placeholder} (not i18next's {{...}}, since this
// site has no i18n library) — this fills them in at render time.
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}
