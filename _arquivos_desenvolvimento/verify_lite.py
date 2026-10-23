"""Static language/asset checks and font-metric fit estimates (not browser rendering)."""
from html.parser import HTMLParser
from pathlib import Path
from PIL import ImageFont
import re

ROOT=Path(__file__).resolve().parents[1]
class Node:
    def __init__(self,tag='',attrs=(),parent=None):
        self.tag=tag; self.attrs=dict(attrs); self.parent=parent; self.children=[]; self.content=[]
    @property
    def text(self):return ''.join(x if isinstance(x,str) else x.text for x in self.content)
    def has(self,cls):return cls in self.attrs.get('class','').split()
    def find(self,cls):return next(n for n in self.walk() if n.has(cls))
    def walk(self):
        yield self
        for c in self.children:yield from c.walk()
class Parse(HTMLParser):
    def __init__(self):super().__init__();self.root=Node();self.current=self.root
    def handle_starttag(self,t,a):
        n=Node(t,a,self.current);self.current.children.append(n);self.current.content.append(n)
        if t not in ['meta','link','img','input','br','hr']:self.current=n
    def handle_endtag(self,t):
        n=self.current
        while n.parent and n.tag!=t:n=n.parent
        if n.parent:self.current=n.parent
    def handle_data(self,data):self.current.content.append(data)

doc=Parse();doc.feed((ROOT/'index_lite.html').read_text(encoding='utf-8'))
nodes=list(doc.root.walk());slides=[n for n in nodes if n.has('slide')]
assert len(slides)==5
ids=[n.attrs['id'] for n in nodes if 'id' in n.attrs];assert len(ids)==len(set(ids))
pairs=[n for n in nodes if n.has('pair')]
for n in pairs:
    assert len(n.children)==2,(n.tag,n.text)
    assert [c.attrs.get('lang') for c in n.children]==['es-PY','pt-BR'],n.text
for n in nodes:
    if n.tag in ['script','link','img']:
        ref=n.attrs.get('src') or n.attrs.get('href')
        assert ref and not ref.startswith('http'),ref
        assert (ROOT/ref).is_file(),ref
fontfile=ROOT/'Develcode Design System/assets/fonts/Satoshi-300-900.woff2'
def lines(text,size,width,weight=500):
    font=ImageFont.truetype(str(fontfile),size);font.set_variation_by_axes([weight]);count=1;line=''
    for word in text.split():
        trial=(line+' '+word).strip()
        if font.getlength(trial)>width and line:count+=1;line=word
        else:line=trial
    return count
def pair_height(node,es_size,pt_size,width,es_line=1.18,pt_line=1.3,margin=6):
    return lines(node.children[0].text,es_size,width)*es_size*es_line+margin+lines(node.children[1].text,pt_size,width)*pt_size*pt_line
for s in slides:
    heading=next(n for n in s.children if n.tag in ('h1','h2'))
    count=lines(heading.children[0].text,58,1472,850)
    assert count==1,(s.attrs['id'],count)
    print(s.attrs['id'],'headline fits one line')
assert not any(n.tag in ('input','select','form') for n in nodes)
translations=[n for n in nodes if n.has('translation')]
assert all(n.attrs.get('lang')=='pt-BR' for n in translations)
print('PASS:',len(slides),'slides;',len(pairs),'ES/PT pairs;',len(translations),'grouped PT translations; local assets exist.')
