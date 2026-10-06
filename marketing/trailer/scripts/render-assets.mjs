import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderMedia,renderStill} from '@remotion/renderer';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const marketing=path.dirname(project);
const out=path.join(project,'out');
await mkdir(out,{recursive:true});
await mkdir(path.join(marketing,'play-store/screenshots'),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(project,'src/index.ts'),outDir:path.join(project,'dist'),publicDir:path.join(project,'public')});
const browser=await openBrowser('chrome');
try {
  const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
  const find=id=>{
    const composition=compositions.find(c=>c.id===id);
    if(!composition)throw new Error(`Missing composition: ${id}`);
    return composition;
  };
  const still=async(id,target,frame=0)=>{
    const {buffer}=await renderStill({serveUrl,composition:find(id),puppeteerInstance:browser,imageFormat:'png',frame});
    await sharp(buffer).removeAlpha().png({compressionLevel:9}).toFile(target);
    console.log(`Rendered ${id}`);
  };
  if(!process.argv.includes('--video-only')) {
    await still('FeatureGraphic',path.join(marketing,'play-store/feature-graphic-1024x500.png'));
    for(let i=1;i<=8;i++) {
      const number=String(i).padStart(2,'0');
      await still(`Screenshot${number}`,path.join(marketing,`play-store/screenshots/${number}.png`));
    }
    await still('AshenVow-StoreTrailer',path.join(out,'trailer-poster.png'),42);
    const frames=[18,110,248,354,464,576,674,758,840,878];
    for(const frame of frames)await still('AshenVow-StoreTrailer',path.join(out,`qa-frame-${frame}.png`),frame);
  }
  if(!process.argv.includes('--stills-only')) {
    let last=0;
    await renderMedia({serveUrl,composition:find('AshenVow-StoreTrailer'),puppeteerInstance:browser,
      codec:'h264',crf:18,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',
      outputLocation:path.join(out,'AshenVow-StoreTrailer-1080x1920.mp4'),concurrency:3,
      onProgress:({progress})=>{const percent=Math.floor(progress*100);if(percent>=last+10){console.log(`Trailer render ${percent}%`);last=percent;}}
    });
    console.log('30-second MP4 rendered.');
  }
} finally {await browser.close({silent:true});}

if(!process.argv.includes('--video-only')) {
  const images=[];
  for(let i=1;i<=8;i++)images.push({input:await sharp(path.join(marketing,`play-store/screenshots/${String(i).padStart(2,'0')}.png`)).resize(270,480).toBuffer(),left:((i-1)%4)*286+16,top:Math.floor((i-1)/4)*496+16});
  await sharp({create:{width:1160,height:1008,channels:3,background:'#141115'}}).composite(images).png().toFile(path.join(marketing,'play-store/screenshots-contact-sheet.png'));
  const frames=[18,110,248,354,464,576,674,758,840,878];
  const board=[];
  for(let i=0;i<frames.length;i++)board.push({input:await sharp(path.join(out,`qa-frame-${frames[i]}.png`)).resize(216,384).toBuffer(),left:(i%5)*232+16,top:Math.floor(i/5)*400+16});
  await sharp({create:{width:1176,height:816,channels:3,background:'#141115'}}).composite(board).png().toFile(path.join(out,'trailer-storyboard.png'));
}
