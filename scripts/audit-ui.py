from pathlib import Path
import re,json,subprocess
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
paths=[Path(p) for p in subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()]
pages=[p for p in paths if p.suffix=='.html' and not any(x in p.parts for x in ['tests','docs','vendor']) and '.template.' not in p.name]
active=set(pages);pending=list(pages)
while pending:
 p=pending.pop();t=(ROOT/p).read_text()
 refs=re.findall(r'(?:src|href)=["\']([^"\']+)["\']',t)
 refs+=re.findall(r'(?:from\s*|import\s*)["\']([^"\']+)["\']',t)
 refs+=re.findall(r'@import\s*["\']([^"\']+)["\']',t)
 for ref in refs:
  ref=unquote(urlsplit(ref).path) if not re.match(r'(?:[a-z]+:|//|#)',ref) else ref
  if re.match(r'(?:[a-z]+:|//|#)',ref):continue
  target=((ROOT/ref.lstrip('/')) if ref.startswith('/') else (ROOT/p.parent/ref)).resolve()
  if not target.is_relative_to(ROOT) or not target.exists() or target.suffix not in ['.css','.js']:continue
  q=target.relative_to(ROOT)
  if 'vendor' in q.parts:continue
  if q not in active:active.add(q);pending.append(q)
def scan(text,path,offset=0,kind='CSS'):
 # Match declarations with strings/comments masked for brace context, preserving offsets.
 masked=re.sub(r'/\*[\s\S]*?\*/',lambda m:' '*len(m[0]),text)
 entries=[]
 for m in re.finditer(r'(?<![\w-])(border(?:-(?:top|bottom)-(?:left|right))?-radius)\s*:\s*([^;}]+)',masked,re.I):
  pos=m.start();stack=[];start=0;quote=None;escape=False
  for i,c in enumerate(masked[:pos]):
   if quote:
    if escape:escape=False
    elif c=='\\':escape=True
    elif c==quote:quote=None
    continue
   if c in '\"\'':quote=c;continue
   if c=='{':
    head=masked[start:i].strip();stack.append(head);start=i+1
   elif c=='}':
    if stack:stack.pop()
    start=i+1
   elif c==';':start=i+1
  selector=next((s for s in reversed(stack) if not s.startswith('@')),'[inline style]')
  entries.append(dict(file=str(path),line=(ROOT/path).read_text()[:offset+pos].count('\n')+1,selector=selector,context=[s for s in stack if s.startswith('@')],property=m[1],value=m[2].strip(),start=offset+m.start(2),end=offset+m.end(2),kind=kind))
 return entries
entries=[];variables=[];state=[]
for p in sorted(active):
 t=(ROOT/p).read_text()
 if p.suffix=='.css':entries+=scan(t,p)
 elif p.suffix=='.html':
  for m in re.finditer(r'<style\b[^>]*>([\s\S]*?)</style>',t,re.I):entries+=scan(m[1],p,m.start(1),'style block')
  for m in re.finditer(r'\bstyle\s*=\s*(["\'])(.*?)\1',t,re.S|re.I):
   for e in scan(m[2],p,m.start(2),'style attribute/template'):
    tag=t[t.rfind('<',0,m.start()):m.start()];e['selector']=tag.strip()+' [style]';entries.append(e)
 # No CSS strings in runtime JS unless explicitly found below.
 if p.suffix=='.js':
  for m in re.finditer(r'border-radius\s*:\s*[^;}"\']+|\.borderRadius\s*=\s*[^;\n]+|setProperty\(["\']border-radius[^\n]+',t):state.append(dict(file=str(p),line=t[:m.start()].count('\n')+1,kind='dynamic radius',code=m[0]))
 for m in re.finditer(r'(--[\w-]*radius[\w-]*)\s*:\s*([^;}\n]+)',t):variables.append(dict(file=str(p),line=t[:m.start()].count('\n')+1,name=m[1],value=m[2].strip()))
 for m in re.finditer(r'<(?:details|summary)\b[^>]*>|[^\n]*(?:aria-expanded|\.hidden\s*=|\.open\s*=|classList\.(?:toggle|add|remove)\([^\n]*(?:expanded|collapsed)|rotate\(180deg\))[^\n]*',t):
  state.append(dict(file=str(p),line=t[:m.start()].count('\n')+1,kind='disclosure/state',code=m[0].strip()))
data=dict(pages=list(map(str,sorted(pages))),files=list(map(str,sorted(active))),radii=entries,variables=variables,states=state)
print(json.dumps(data,ensure_ascii=False,indent=2))
