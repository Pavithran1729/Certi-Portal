import base64
with open('docs/spcet_logo_data_uri.txt', 'r') as f:
    data = f.read()
b64 = data.split('base64,')[1]
with open('docs/college_template.png', 'wb') as f:
    f.write(base64.b64decode(b64))
