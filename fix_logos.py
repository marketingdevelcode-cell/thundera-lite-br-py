import re

with open('original_index.html', 'r', encoding='utf-8') as f:
    orig = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    curr = f.read()

match_orig = re.search(r'(<div class="logo-card-ds anim-logo logo-soft" style="animation-delay: 0\.35s;"><img\s*src="assets/logo-unibanco-white\.png" alt="Instituto Unibanco"></div>.*?)</div>\s*<!-- Footer Infinite Ticker -->', orig, re.DOTALL)

if match_orig:
    pristine_block = match_orig.group(1)
    updated_block = pristine_block.replace('assets/Logo-CNBB---Brancp.png', 'assets/Inspirali lg.png').replace('alt="CNBB"', 'alt="Inspirali"')
    
    match_curr = re.search(r'(<div class="logo-card-ds anim-logo logo-soft" style="animation-delay: 0\.35s;"><img\s*src="assets/logo-unibanco-white\.png" alt="Instituto Unibanco"></div>.*?)</div>\s*<!-- Footer Infinite Ticker -->', curr, re.DOTALL)
    
    if match_curr:
        curr = curr.replace(match_curr.group(1), updated_block)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(curr)
        print("Success")
    else:
        print("Fail curr")
else:
    print("Fail orig")
