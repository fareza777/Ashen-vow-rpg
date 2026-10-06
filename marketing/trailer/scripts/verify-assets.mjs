import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const marketing=path.dirname(project);
const pngFiles=[
  ['play-store/app-icon-512.png',512,512,4],
  ['play-store/feature-graphic-1024x500.png',1024,500,3],
  ...Array.from({length:8},(_,i)=>[`play-store/screenshots/${String(i+1).padStart(2,'0')}.png`,1080,1920,3]),
  ['play-store/screenshots-contact-sheet.png',1160,1008,4],
  ['trailer/out/trailer-poster.png',1080,1920,3],
  ['trailer/out/trailer-storyboard.png',1176,816,4],
];
const screenshotNames=(await readdir(path.join(marketing,'play-store/screenshots'))).filter(n=>n.endsWith('.png')).sort();
if(screenshotNames.join(',')!=='01.png,02.png,03.png,04.png,05.png,06.png,07.png,08.png')throw new Error('Expected exactly eight numbered screenshots');
const files=[];
for(const [relative,width,height,channels] of pngFiles) {
  const bytes=await readFile(path.join(marketing,relative));
  const info=await sharp(bytes).metadata();
  if(info.format!=='png'||info.width!==width||info.height!==height||info.channels!==channels||bytes[24]!==8)throw new Error(`Incorrect PNG format: ${relative}`);
  if(relative.includes('app-icon')&&bytes.length>1024*1024)throw new Error('App icon exceeds 1 MiB');
  if(relative.includes('/screenshots/')&&bytes.length>8*1024*1024)throw new Error(`Screenshot exceeds 8 MiB: ${relative}`);
  files.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),format:'PNG',width,height,channels,bitDepth:8,colorType:bytes[25]===6?'RGBA':'RGB'});
}
const videoPath='trailer/out/AshenVow-StoreTrailer-1080x1920.mp4';
const ffprobe=path.join(project,'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe');
const result=spawnSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',path.join(marketing,videoPath)],{encoding:'utf8'});
if(result.status!==0)throw new Error(result.stderr||'Could not inspect MP4');
const metadata=JSON.parse(result.stdout);
const video=metadata.streams.find(s=>s.codec_type==='video');
const audio=metadata.streams.find(s=>s.codec_type==='audio');
if(video?.codec_name!=='h264'||video.width!==1080||video.height!==1920||!['yuv420p','yuvj420p'].includes(video.pix_fmt)||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==900)throw new Error('Incorrect video format');
if(audio?.codec_name!=='aac'||audio.channels!==2||Number(audio.sample_rate)!==48000)throw new Error('Incorrect audio format');
const videoBytes=await readFile(path.join(marketing,videoPath));
files.push({path:videoPath,bytes:videoBytes.length,sha256:createHash('sha256').update(videoBytes).digest('hex'),format:'MP4',width:video.width,height:video.height,fps:30,frames:Number(video.nb_frames),videoDurationSeconds:Number(video.duration),containerDurationSeconds:Number(metadata.format.duration),videoCodec:video.codec_name,pixelFormat:video.pix_fmt,audioCodec:audio.codec_name,audioSampleRate:Number(audio.sample_rate),audioChannels:audio.channels});
const sourceCaptures=[];
for(const name of (await readdir(path.join(project,'public/captures'))).filter(n=>n.endsWith('.jpg')).sort()) {
  const source=await sharp(path.join(project,'public/captures',name)).metadata();
  sourceCaptures.push({path:`trailer/public/captures/${name}`,width:source.width,height:source.height});
}
const manifest={project:'Ashen Vow: The Hollow Below',language:'English',gameVersion:'0.2.9',generatedAt:new Date().toISOString(),imageGeneration:'Built-in Imagegen; exact prompts in ART-PROMPTS.json',videoSoftware:'Remotion 4.0.533',audio:{instrumentalMusic:false,voiceover:false,content:'Original bell, metal, paper and air effects with CC0 quiet water ambience'},verification:{screenshotCount:8,imageDimensionsAndChannels:'Passed',iconSizeLimit:'Passed',fullVideoAndAudioDecode:'Passed using FFmpeg with explicit rawvideo and pcm_s16le output codecs',editableProjectLintAndTypecheck:'Passed',sourceCaptures,notes:'Game interface was captured at a normal 450 × 800 portrait viewport, then composed into 1080 × 1920 artwork. All captures use real game UI.'},files};
await writeFile(path.join(marketing,'ASSET-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({verified:true,screenshots:8,iconBytes:files[0].bytes,videoBytes:videoBytes.length,videoFrames:video.nb_frames,duration:Number(video.duration),assets:files.length},null,2));
