export function blockDataToText(data){
    let words = ''
    if(data && data.blocks && data.blocks.length > 0) {
        data.blocks.forEach(block => { 
            let sentence = block.data.text.trim()
            words = `${words}\n${sentence}`
        })
    } 
    return words
}

export function wordsInText (text) {
    if (!text) return 0
    
    text = text.trim() 
    var split = text.split(/\s+/g)
    if (split.length === 1) {
        return split[0].trim() === '' ? 0 : 1
    } else {
        return split.length
    }
}

export function charsInText(text) {
    if (!text) return 0
    return text.length
}