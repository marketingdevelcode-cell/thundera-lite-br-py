import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('assets/Logo-CNBB---Brancp.png', 'assets/Inspirali lg.png')
content = content.replace('alt="CNBB"', 'alt="Inspirali"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
