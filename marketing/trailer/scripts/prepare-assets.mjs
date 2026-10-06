import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const marketing=path.dirname(project);
await mkdir(path.join(project,'public/clips'),{recursive:true});
await mkdir(path.join(marketing,'play-store'),{recursive:true});

// Format conversion only: preserve the generated master's content and square edges.
await sharp(path.join(marketing,'masters/lantern-icon.png')).resize(512,512,{fit:'fill'}).ensureAlpha().png({compressionLevel:9}).toFile(path.join(marketing,'play-store/app-icon-512.png'));
await sharp(path.join(marketing,'masters/lantern-icon.png')).resize(1024,1024).ensureAlpha().png({compressionLevel:9}).toFile(path.join(marketing,'masters/app-icon-1024.png'));
for(const name of ['01-combat','02-event','03-map','04-story','05-skills','06-equipment','07-quests','08-town']) {
  const source=path.join(marketing,'captures',`${name}.jpg`);
  // Use the normal, validated browser screenshot API. DPR override screenshots
  // are unreliable in this provider; final artwork dimensions are set by Remotion.
  const original=await sharp(source).removeAlpha().png().toBuffer();
  await writeFile(path.join(marketing,'captures',`${name}.png`),original);
  await sharp(original).jpeg({quality:98,chromaSubsampling:'4:4:4'}).toFile(path.join(project,'public/captures',`${name}.jpg`));
}

const executable=path.join(project,'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const ffmpeg=(args)=>{
  const r=spawnSync(executable,['-hide_banner','-loglevel','error',...args],{encoding:'utf8'});
  if(r.status!==0)throw new Error(r.stderr||`FFmpeg exited ${r.status}`);
};
for(const clip of await readdir(path.join(marketing,'captures/clips'),{withFileTypes:true})) {
  if(!clip.isDirectory())continue;
  const dir=path.join(marketing,'captures/clips',clip.name);
  const metadata=JSON.parse(await readFile(path.join(dir,'frames.json'),'utf8'));
  const frames=metadata.frames;
  if(!frames.length)throw new Error(`No frames: ${clip.name}`);
  const lines=['ffconcat version 1.0'];
  for(let i=0;i<frames.length;i++) {
    const current=frames[i];
    const seconds=i<frames.length-1 ? Math.max(1/240,frames[i+1].time-current.time) : Math.max(1/30,metadata.durationMs/1000+2-(current.time-frames[0].time));
    lines.push(`file '${current.file}'`,`duration ${seconds.toFixed(6)}`);
  }
  lines.push(`file '${frames.at(-1).file}'`);
  const list=path.join(dir,'timeline.ffconcat');
  await writeFile(list,lines.join('\n'));
  // Preserve the final real frame long enough for its English text to be read.
  // Remotion's bundled FFmpeg intentionally omits fps/tpad filters. The concat
  // timestamps and output frame rate achieve the same readable frame holds.
  // Do not cut with -t: that drops the final timestamp needed to hold the frame.
  ffmpeg(['-y','-safe','0','-f','concat','-i',list,'-r','30','-fps_mode','cfr','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',path.join(project,'public/clips',`${clip.name}.mp4`)]);
  console.log(`${clip.name}: ${frames.length} actual captured frames`);
}
ffmpeg(['-y','-i',path.join(project,'public/audio/town-stonewater.mp3'),'-t','30','-ar','48000','-ac','2','-c:a','pcm_s16le',path.join(project,'public/audio/ambient-source.wav')]);
console.log('Native screenshots, clips, icon exports and ambient source ready.');
