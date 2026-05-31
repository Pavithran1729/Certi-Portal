const fs = require('fs');
const txt = fs.readFileSync('docs/spcet_logo_data_uri.txt', 'utf8');
const b64 = txt.split('base64,')[1];
fs.writeFileSync('docs/college_template.png', b64, 'base64');
