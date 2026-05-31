const fs = require('fs');
const JSZip = require('jszip');

async function go() {
  const files = ['INTERNSHIP.docx', 'OTHERS.docx', 'PRIVATE SCHOLARSHIP (18).docx'];
  for (const f of files) {
    try {
      const buf = fs.readFileSync('docs/' + f);
      const zip = await JSZip.loadAsync(buf);
      const docFile = zip.file('word/document.xml');
      if (!docFile) { console.log('NO DOC XML: ' + f); continue; }
      const doc = await docFile.async('string');
      const text = doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('=== ' + f + ' ===');
      console.log(text.substring(0, 3000));
      console.log('--- END ---');
    } catch (e) {
      console.log('ERR: ' + f + ': ' + e.message);
    }
  }
}

go();
