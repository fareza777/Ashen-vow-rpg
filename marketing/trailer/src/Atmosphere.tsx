import {AbsoluteFill,CanvasImage,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {colors} from './theme';

export const Atmosphere=({animated=true}:{animated?:boolean})=>{
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor:colors.ink,overflow:'hidden'}}>
    <CanvasImage src={staticFile('art/vesper-banner.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'70% center',opacity:0.27,scale:animated?interpolate(frame,[0,900],[1.02,1.11],{extrapolateRight:'clamp'}):1.02}} />
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(14,12,16,.34),rgba(14,12,16,.86) 38%,rgba(14,12,16,.68))'}} />
    {animated && Array.from({length:15},(_,i)=><div key={i} style={{position:'absolute',left:72+(i*173)%960,top:1920-((frame*(0.7+(i%4)*.25)+i*157)%2100),width:i%3===0?4:2,height:i%3===0?4:2,borderRadius:'50%',background:colors.gold,opacity:.12+(i%3)*.1,boxShadow:'0 0 12px #ba6238'}}/>)}
  </AbsoluteFill>;
};
