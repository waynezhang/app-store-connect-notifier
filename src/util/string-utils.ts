export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatEnumString(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map((s) => capitalizeString(s))
    .join(' ');
}
