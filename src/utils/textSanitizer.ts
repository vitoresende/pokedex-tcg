/**
 * Text Encoding and Mojibake Sanitizer Utility
 * 
 * Fixes encoding artifacts (e.g. UTF-8 misinterpreted as Latin-1 / Windows-1252)
 * and provides robust smart file decoding for CSV and user imports.
 */

export function fixMojibake(input: string): string {
  if (!input) return input;
  
  let s = input;
  
  // Known mojibake mappings (UTF-8 bytes read as Windows-1252 / ISO-8859-1)
  const mojibakeMap: Record<string, string> = {
    'Ã§': 'ç',
    'Ã‡': 'Ç',
    'Ã£': 'ã',
    'Ãƒ': 'Ã',
    'Ãµ': 'õ',
    'Ã•': 'Õ',
    'Ã¡': 'á',
    'Ã\u0081': 'Á',
    'Ã©': 'é',
    'Ã‰': 'É',
    'Ãª': 'ê',
    'ÃŠ': 'Ê',
    'Ã­': 'í',
    'Ã\u008d': 'Í',
    'Ã³': 'ó',
    'Ã“': 'Ó',
    'Ã´': 'ô',
    'Ã”': 'Ô',
    'Ãº': 'ú',
    'Ãš': 'Ú',
    'Ã¼': 'ü',
    'Ãœ': 'Ü',
    'â€“': '–',
    'â€”': '—',
    'â€˜': "'",
    'â€™': "'",
    'â€œ': '"',
    'â€\u009d': '"',
    'Â ': ' ',
  };

  for (const [bad, good] of Object.entries(mojibakeMap)) {
    if (s.includes(bad)) {
      s = s.split(bad).join(good);
    }
  }

  // Handle any orphan replacement characters in common set names
  if (s.includes('Eclipse Csmico') || s.includes('Eclipse C\ufffdsmico')) {
    s = s.replace(/Eclipse C[\ufffd\?]smico/g, 'Eclipse Cósmico');
  }

  return s;
}

/**
 * Smart file reader: attempts UTF-8 decode first (with strict fatal=true),
 * and safely falls back to Windows-1252 / Latin-1 if invalid UTF-8 bytes are found.
 */
export async function readFileSmart(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const text = utf8Decoder.decode(arrayBuffer);
    return fixMojibake(text);
  } catch {
    // If strict UTF-8 fails, fallback to Windows-1252 (Latin-1 superset)
    const win1252Decoder = new TextDecoder('windows-1252');
    const text = win1252Decoder.decode(arrayBuffer);
    return fixMojibake(text);
  }
}
