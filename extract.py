import zipfile, re, sys

files = ['docs/INTERNSHIP.docx', 'docs/OTHERS.docx', 'docs/PRIVATE SCHOLARSHIP (18).docx']
for f in files:
    try:
        with zipfile.ZipFile(f) as z:
            with z.open('word/document.xml') as doc:
                xml = doc.read().decode('utf-8')
                text = re.sub(r'<[^>]+>', ' ', xml)
                text = re.sub(r'\s+', ' ', text).strip()
                print(f'=== {f} ===')
                print(text[:3000])
                print('--- END ---')
    except Exception as e:
        print(f'ERR: {f}: {e}')
