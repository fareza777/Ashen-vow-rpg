// Curated demonstration saves. The real game renders every screen and resolves
// every combat action. Enemy values and rewards are never replaced for capture.
import {mkdirSync, writeFileSync} from 'node:fs';
import {createGame, reduceGame, stats, canMove, type GameState} from '../src/engine';
import {QUESTS, EVENTS} from '../src/data';

mkdirSync('marketing/captures/saves', {recursive: true});
const save = (name: string, s: GameState) => {
  s.notice = '';
  s.battleFx = null;
  s.tutorialDismissed = true;
  writeFileSync(`marketing/captures/saves/${name}.json`, JSON.stringify(s, null, 2));
};
const base = createGame('Elara', 'oathkeeper', 61317);
base.level = 5;
base.day = 12;
base.gold = 187;
base.xp = 138;
base.attributes = {might: 8, will: 8, agility: 2};
base.statPoints = 0;
base.skillPoints = 2;
base.skills = ['mend', 'vigor', 'bulwark', 'ember'];
base.inventory = ['rust-sword','traveler-coat','oathblade','bellplate','cinder-ring','thorn-dagger','bark-mail','moth-charm'];
base.equipped = {weapon:'oathblade',armor:'bellplate',charm:'cinder-ring'};
base.claimed = ['bell','drowned-ledger'];
base.completed = [...base.claimed];
base.accepted = [...base.claimed, 'testimony'];
base.activeQuest = 'testimony';
base.bosses = ['warden'];
base.kills = 26;
base.explored = 57;
base.reputation = 2;
base.questProgress = {bell:1,'drowned-ledger':1};
base.hp = stats(base).maxHp;
base.energy = stats(base).maxEnergy;
save('town', structuredClone(base));

let guardian = reduceGame(structuredClone(base), {type:'ENTER',biome:'catacombs'});
const bossNode = guardian.run!.nodes.find(n=>n.kind==='boss')!;
const beforeBoss = guardian.run!.nodes.find(n=>n.row===bossNode.row-1 && n.col===bossNode.col)!;
for (const n of guardian.run!.nodes) {
  if(n.row<bossNode.row) {n.visited=true;n.resolved=true;}
}
guardian.run!.current=beforeBoss.id;
guardian.run!.rooms=12;
guardian=reduceGame(guardian,{type:'MOVE',id:bossNode.id});
guardian=reduceGame(guardian,{type:'COMBAT',action:'guard'});
save('guardian',guardian);
console.log('guardian',guardian.combat?.enemyId,guardian.combat?.maxHp);

// Discover real first-room encounter/event combinations from the seeded generator.
for (const mode of ['combat','event','map'] as const) {
  for (let seed=1; seed<300; seed++) {
    const s=structuredClone(base);
    s.seed=seed*2654435761>>>0;
    s.claimed=[];s.completed=[];s.accepted=['bell'];s.activeQuest='bell';
    let run=reduceGame(s,{type:'ENTER',biome:'catacombs'});
    if(mode==='map') {save(mode,run);break;}
    const node=run.run!.nodes.find(n=>canMove(run,n.id) && (mode==='combat' ? n.kind==='fight' : n.kind==='event'));
    if(!node)continue;
    if(mode==='event') {
      const event=EVENTS.find(e=>e.id===node.event);
      if(!event || event.choices.length<2 || event.text.length>520)continue;
    }
    run=reduceGame(run,{type:'MOVE',id:node.id});
    if(mode==='combat') {
      run=reduceGame(run,{type:'COMBAT',action:'guard'});
      if(!run.combat)continue;
    }
    save(mode,run);
    console.log(mode, run.combat?.enemyId??run.run?.eventId, run.run?.nodes.length);
    break;
  }
}
console.log('Actual content', QUESTS.filter(q=>q.type==='Main quest').length,
  QUESTS.filter(q=>q.type==='Side quest').length, EVENTS.length);
