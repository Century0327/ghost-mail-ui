export function cleanLetterBody(html: string): string {
  if (!html) return ''
  
  let text = html
  
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  text = text.replace(/<p[^>]*>/gi, '')
  
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi
  text = text.replace(tableRegex, '')
  
  const divRegex = /<div[^>]*>[\s\S]*?<\/div>/gi
  text = text.replace(divRegex, (match) => {
    if (/信任值|好感度|好感值/.test(match)) return ''
    return match.replace(/<[^>]+>/g, '') + '\n'
  })
  
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  text = text.replace(/<u>([\s\S]*?)<\/u>/gi, '$1')
  
  text = text.replace(/<[^>]+>/g, '')
  
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  
  return text
}

export function extractImagesFromHtml(html: string): string[] {
  if (!html) return []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const images: string[] = []
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1])
  }
  return images
}

export function formatLetterPreview(body: string, maxLen = 30): string {
  const clean = cleanLetterBody(body)
  const plain = clean.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  if (plain.length <= maxLen) return plain
  return plain.slice(0, maxLen) + '...'
}
