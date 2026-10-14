const {PNG}=require('pngjs');
const {createHash}=require('node:crypto');
const LIMITS=Object.freeze({channel:2,pixels:32,regions:2,regionPixels:16,regionSpan:8});
function rasterHash(buffer){const p=PNG.sync.read(buffer);return createHash('sha256').update(`${p.width},${p.height}:`).update(p.data).digest('hex');}
function cornerAt(x,y,cards,scale) {
  for(const card of cards) {
    if(!String(card.classes).split(/\s+/).includes('card')||card.rect[2]<=0||card.rect[3]<=0||card.style.transform!=='none')continue;
    const widths=['top','right','bottom','left'].map(side=>parseFloat(card.style[`border-${side}-width`]));
    if(!widths.every(n=>n===widths[0]&&n>0&&n<=2))continue;
    const [left,top,width,height]=card.rect.map(n=>n*scale),right=left+width,bottom=top+height;
    for(const [name,sx,sy] of [['top-left',-1,-1],['top-right',1,-1],['bottom-left',-1,1],['bottom-right',1,1]]) {
      const value=card.style[`border-${name}-radius`];if(!/^\d+(?:\.\d+)?px$/.test(value))continue;
      const radius=parseFloat(value)*scale,border=widths[0]*scale;
      if(radius<=border||2*radius>Math.min(width,height))continue;
      const cx=sx<0?left+radius:right-radius,cy=sy<0?top+radius:bottom-radius;
      if((sx<0?x+1>cx:x<cx)||(sy<0?y+1>cy:y<cy))continue;
      const min=Math.hypot(Math.max(x-cx,0,cx-x-1),Math.max(y-cy,0,cy-y-1));
      const max=Math.max(...[x,x+1].flatMap(xx=>[y,y+1].map(yy=>Math.hypot(xx-cx,yy-cy))));
      // The actual outer/inner circular boundary must intersect this pixel's area.
      if([radius,radius-border].some(r=>min<=r+1e-6&&max>=r-1e-6))return {key:`${card.id}:${name}`,card,name};
    }
  }
  return null;
}
function hasGradient(image,x,y) {
  const colors=[];for(let yy=Math.max(0,y-1);yy<=Math.min(image.height-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(image.width-1,x+1);xx++) {
    const i=(yy*image.width+xx)*4;colors.push(Array.from(image.data.subarray(i,i+3)));
  }
  return [0,1,2].some(c=>Math.max(...colors.map(p=>p[c]))-Math.min(...colors.map(p=>p[c]))>=4);
}
function comparePNG(before,after,{name,structureEqual,cards=[],scale=1,referenceRasters=[]}={}) {
  const a=PNG.sync.read(before),b=PNG.sync.read(after);
  const result={name,status:'FAIL',strictDifferentPixels:0,maxRGBDifference:0,maxAlphaDifference:0,boundingBox:null,
    variancePassed:false,structureChanged:!structureEqual,dimensions:[[a.width,a.height],[b.width,b.height]],pixels:[],regions:[]};
  if(a.width!==b.width||a.height!==b.height)return {...result,strictDifferentPixels:null,reason:'image dimensions changed'};
  let minX=a.width,minY=a.height,maxX=-1,maxY=-1;const groups=new Map();let edgeValid=true;
  for(let i=0;i<a.data.length;i+=4) {
    if(a.data[i]===b.data[i]&&a.data[i+1]===b.data[i+1]&&a.data[i+2]===b.data[i+2]&&a.data[i+3]===b.data[i+3])continue;
    const x=(i/4)%a.width,y=Math.floor(i/4/a.width),u=Array.from(a.data.subarray(i,i+4)),v=Array.from(b.data.subarray(i,i+4));
    result.strictDifferentPixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    result.maxRGBDifference=Math.max(result.maxRGBDifference,...u.slice(0,3).map((n,c)=>Math.abs(n-v[c])));
    result.maxAlphaDifference=Math.max(result.maxAlphaDifference,Math.abs(u[3]-v[3]));
    if(result.pixels.length<256)result.pixels.push({x,y,before:u,after:v});
    const corner=cornerAt(x,y,cards,scale);
    if(!corner||!hasGradient(a,x,y)||!hasGradient(b,x,y)){edgeValid=false;continue;}
    if(!groups.has(corner.key))groups.set(corner.key,{corner,points:[]});groups.get(corner.key).points.push([x,y]);
  }
  if(result.strictDifferentPixels)result.boundingBox=[minX,minY,maxX+1,maxY+1];
  if(!structureEqual)return {...result,reason:'DOM/text/all computed styles/pseudo-elements/variables/geometry/state changed'};
  if(!result.strictDifferentPixels)return {...result,status:'PASS',reason:'strict pixels identical'};
  if(result.maxRGBDifference>LIMITS.channel||result.maxAlphaDifference!==0||result.strictDifferentPixels>LIMITS.pixels||!edgeValid||!groups.size||groups.size>LIMITS.regions)
    return {...result,reason:'not a bounded rounded-edge raster candidate'};
  for(const {corner,points} of groups.values()) {
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),box=[Math.min(...xs),Math.min(...ys),Math.max(...xs)+1,Math.max(...ys)+1];
    if(points.length>LIMITS.regionPixels||box[2]-box[0]>LIMITS.regionSpan||box[3]-box[1]>LIMITS.regionSpan)
      return {...result,reason:'rounded-edge region exceeds absolute local bounds'};
    // Connect fragments through unchanged antialiased boundary pixels, not through card interiors.
    const reachable=new Set([points[0].join(',')]),queue=[points[0]];
    for(let n=0;n<queue.length;n++)for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++) {
      const x=queue[n][0]+dx,y=queue[n][1]+dy,key=`${x},${y}`;
      if(reachable.has(key)||x<box[0]-1||x>box[2]||y<box[1]-1||y>box[3])continue;
      if(cornerAt(x,y,[corner.card],scale)?.key===corner.key&&hasGradient(a,x,y)&&hasGradient(b,x,y)){reachable.add(key);queue.push([x,y]);}
    }
    if(!points.every(p=>reachable.has(p.join(','))))return {...result,reason:'edge fragments are not locally connected'};
    result.regions.push({element:corner.card.id,corner:corner.name,boundingBox:box,pixels:points.length});
  }
  result.rasterCandidate=true;
  // Geometry alone cannot distinguish fabricated edge color from raster noise.
  // Require the ENTIRE candidate image to have been independently rendered from Phase 0.
  const hashes=new Set(referenceRasters.map(rasterHash));hashes.add(rasterHash(before));
  if(!hashes.has(rasterHash(after)))return {...result,status:'REVIEW_REQUIRED',reason:'candidate not reproduced by the fixed same-source evidence batch'};
  return {...result,status:'PASS_WITH_RASTER_VARIANCE',variancePassed:true,reason:'bounded connected AA edge; RGB <= 2; equal alpha; strict structure; independently reproduced Phase 0 raster'};
}
module.exports={comparePNG,rasterHash,LIMITS};
