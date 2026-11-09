export function escapeDelimitedField(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n');
}

export function splitDelimitedLine(value: string): string[] {
  const fields: string[] = [];
  let field = '';
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      field +=
        character === 'n'
          ? '\n'
          : character === 'r'
            ? '\r'
            : character === '|' || character === '\\'
              ? character
              : `\\${character}`;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '|') {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }
  if (escaped) field += '\\';
  fields.push(field.trim());
  return fields;
}
