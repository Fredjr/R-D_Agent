/**
 * PubMed XML Parsing Utilities
 * Shared utilities for parsing PubMed XML responses
 */

/**
 * Decode HTML entities in text
 * Handles both named entities (&ouml;) and numeric entities (&#246; or &#xF6;)
 */
export function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    // Common accented characters
    '&Agrave;': 'À', '&Aacute;': 'Á', '&Acirc;': 'Â', '&Atilde;': 'Ã', '&Auml;': 'Ä', '&Aring;': 'Å',
    '&agrave;': 'à', '&aacute;': 'á', '&acirc;': 'â', '&atilde;': 'ã', '&auml;': 'ä', '&aring;': 'å',
    '&Egrave;': 'È', '&Eacute;': 'É', '&Ecirc;': 'Ê', '&Euml;': 'Ë',
    '&egrave;': 'è', '&eacute;': 'é', '&ecirc;': 'ê', '&euml;': 'ë',
    '&Igrave;': 'Ì', '&Iacute;': 'Í', '&Icirc;': 'Î', '&Iuml;': 'Ï',
    '&igrave;': 'ì', '&iacute;': 'í', '&icirc;': 'î', '&iuml;': 'ï',
    '&Ograve;': 'Ò', '&Oacute;': 'Ó', '&Ocirc;': 'Ô', '&Otilde;': 'Õ', '&Ouml;': 'Ö', '&Oslash;': 'Ø',
    '&ograve;': 'ò', '&oacute;': 'ó', '&ocirc;': 'ô', '&otilde;': 'õ', '&ouml;': 'ö', '&oslash;': 'ø',
    '&Ugrave;': 'Ù', '&Uacute;': 'Ú', '&Ucirc;': 'Û', '&Uuml;': 'Ü',
    '&ugrave;': 'ù', '&uacute;': 'ú', '&ucirc;': 'û', '&uuml;': 'ü',
    '&Ccedil;': 'Ç', '&ccedil;': 'ç',
    '&Ntilde;': 'Ñ', '&ntilde;': 'ñ',
    '&Yacute;': 'Ý', '&yacute;': 'ý', '&yuml;': 'ÿ',
    '&szlig;': 'ß', '&AElig;': 'Æ', '&aelig;': 'æ', '&OElig;': 'Œ', '&oelig;': 'œ',
    // Turkish characters
    '&Scedil;': 'Ş', '&scedil;': 'ş',
    '&Gbreve;': 'Ğ', '&gbreve;': 'ğ',
    // Additional common characters
    '&ndash;': '–', '&mdash;': '—', '&hellip;': '…',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&bull;': '•', '&middot;': '·', '&deg;': '°',
    '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
    '&frac12;': '½', '&frac14;': '¼', '&frac34;': '¾',
    '&alpha;': 'α', '&beta;': 'β', '&gamma;': 'γ', '&delta;': 'δ',
    '&micro;': 'µ', '&pi;': 'π', '&sigma;': 'σ'
  };

  let decoded = text;
  
  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Replace numeric entities (&#xxx; and &#xHHH;)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

/**
 * Extract and decode author names from PubMed XML
 * Returns array of author names in "FirstName LastName" format
 */
export function extractAuthors(articleXML: string): string[] {
  const authors: string[] = [];
  const authorMatches = articleXML.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
  
  for (const authorXML of authorMatches) {
    const lastNameMatch = authorXML.match(/<LastName>(.*?)<\/LastName>/);
    const firstNameMatch = authorXML.match(/<ForeName>(.*?)<\/ForeName>/);
    const initialsMatch = authorXML.match(/<Initials>(.*?)<\/Initials>/);
    
    if (lastNameMatch) {
      const lastName = decodeHTMLEntities(lastNameMatch[1]);
      const firstName = firstNameMatch ? decodeHTMLEntities(firstNameMatch[1]) : '';
      const initials = initialsMatch ? decodeHTMLEntities(initialsMatch[1]) : '';
      
      // Prefer full first name, fall back to initials
      const displayName = firstName || initials;
      authors.push(displayName ? `${displayName} ${lastName}` : lastName);
    }
  }
  
  return authors;
}

/**
 * Extract and decode title from PubMed XML
 */
export function extractTitle(articleXML: string): string {
  const titleMatch = articleXML.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
  return titleMatch ? decodeHTMLEntities(titleMatch[1].replace(/<[^>]*>/g, '')).trim() : '';
}

/**
 * Extract and decode journal name from PubMed XML
 */
export function extractJournal(articleXML: string): string {
  const journalMatch = articleXML.match(/<Title>(.*?)<\/Title>/);
  return journalMatch ? decodeHTMLEntities(journalMatch[1].replace(/<[^>]*>/g, '')).trim() : '';
}

/**
 * Extract and decode abstract from PubMed XML
 */
export function extractAbstract(articleXML: string): string {
  const abstractMatch = articleXML.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
  return abstractMatch ? decodeHTMLEntities(abstractMatch[1].replace(/<[^>]*>/g, '')).trim() : '';
}

/**
 * Extract PMID from PubMed XML
 */
export function extractPMID(articleXML: string): string {
  const pmidMatch = articleXML.match(/<PMID[^>]*>(\d+)<\/PMID>/);
  return pmidMatch ? pmidMatch[1] : '';
}

/**
 * Extract publication year from PubMed XML
 */
export function extractYear(articleXML: string): number {
  const yearMatch = articleXML.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
  return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
}

/**
 * Extract DOI from PubMed XML
 */
export function extractDOI(articleXML: string): string {
  const doiMatch = articleXML.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
  return doiMatch ? doiMatch[1] : '';
}

