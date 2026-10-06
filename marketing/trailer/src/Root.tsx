import {Composition,Folder,Still} from 'remotion';
import {Trailer} from './Trailer';
import {StoreScreenshot,FeatureGraphic} from './StoreAssets';
import {fontReady} from './theme';
import {Hook} from './scenes/Hook';
import {Battle} from './scenes/Battle';
import {Exploration} from './scenes/Exploration';
import {Choices} from './scenes/Choices';
import {Story} from './scenes/Story';
import {Build} from './scenes/Build';
import {Relics} from './scenes/Relics';
import {Quests} from './scenes/Quests';
import {Town} from './scenes/Town';
import {Closing} from './scenes/Closing';

void fontReady;
export const RemotionRoot=()=> <>
  <Composition id="AshenVow-StoreTrailer" component={Trailer} width={1080} height={1920} fps={30} durationInFrames={900}/>
  <Folder name="Trailer-scenes">
    <Composition id="Hook" component={Hook} width={1080} height={1920} fps={30} durationInFrames={66}/>
    <Composition id="Battle" component={Battle} width={1080} height={1920} fps={30} durationInFrames={150}/>
    <Composition id="Exploration" component={Exploration} width={1080} height={1920} fps={30} durationInFrames={120}/>
    <Composition id="Choices" component={Choices} width={1080} height={1920} fps={30} durationInFrames={120}/>
    <Composition id="Story" component={Story} width={1080} height={1920} fps={30} durationInFrames={120}/>
    <Composition id="Build" component={Build} width={1080} height={1920} fps={30} durationInFrames={108}/>
    <Composition id="Relics" component={Relics} width={1080} height={1920} fps={30} durationInFrames={90}/>
    <Composition id="Quests" component={Quests} width={1080} height={1920} fps={30} durationInFrames={84}/>
    <Composition id="Town" component={Town} width={1080} height={1920} fps={30} durationInFrames={96}/>
    <Composition id="Closing" component={Closing} width={1080} height={1920} fps={30} durationInFrames={54}/>
  </Folder>
  <Folder name="Play-Store-assets">
    <Still id="FeatureGraphic" component={FeatureGraphic} width={1024} height={500}/>
    <Still id="Screenshot01" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'Every turn\nhas a cost.',capture:'01-combat.jpg',number:'01',detail:'TURN-BASED COMBAT'}}/>
    <Still id="Screenshot02" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'The dark\noffers a choice.',capture:'02-event.jpg',number:'02',detail:'BRANCHING EVENTS'}}/>
    <Still id="Screenshot03" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'No descent\nis the same.',capture:'03-map.jpg',number:'03',detail:'GENERATED DUNGEONS'}}/>
    <Still id="Screenshot04" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'Your name.\nTomorrow’s date.',capture:'04-story.jpg',number:'04',detail:'AN EIGHT-ACT STORY'}}/>
    <Still id="Screenshot05" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'Forge your\nown oath.',capture:'05-skills.jpg',number:'05',detail:'24 SKILLS · 3 DISCIPLINES'}}/>
    <Still id="Screenshot06" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'Relics with\na past.',capture:'06-equipment.jpg',number:'06',detail:'48 ILLUSTRATED ITEMS'}}/>
    <Still id="Screenshot07" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'More than\none story.',capture:'07-quests.jpg',number:'07',detail:'37 SIDE QUESTS'}}/>
    <Still id="Screenshot08" component={StoreScreenshot} width={1080} height={1920} defaultProps={{title:'Return. Rebuild.\nDescend.',capture:'08-town.jpg',number:'08',detail:'OFFLINE · LOCAL SAVES'}}/>
  </Folder>
</>;
