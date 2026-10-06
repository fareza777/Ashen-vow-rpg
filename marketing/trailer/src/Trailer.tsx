import {AbsoluteFill,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {TransitionSeries,linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
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

export const Trailer=()=> <AbsoluteFill style={{background:'#100e11'}}>
  <TransitionSeries>
    <TransitionSeries.Sequence name="The bell has your name" durationInFrames={66}><Hook/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Every turn has a cost" durationInFrames={150}><Battle/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Unknown routes" durationInFrames={120}><Exploration/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Meaningful choices" durationInFrames={120}><Choices/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="A name dated tomorrow" durationInFrames={120}><Story/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Character disciplines" durationInFrames={108}><Build/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Relics and equipment" durationInFrames={90}><Relics/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Side quests" durationInFrames={84}><Quests/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Return and rebuild" durationInFrames={96}><Town/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:12})}/>
    <TransitionSeries.Sequence name="Leave room for a dawn" durationInFrames={54}><Closing/></TransitionSeries.Sequence>
  </TransitionSeries>
  <Audio name="Original cinematic sound design — no music" src={staticFile('audio/trailer-sound-design.wav')}/>
</AbsoluteFill>;
