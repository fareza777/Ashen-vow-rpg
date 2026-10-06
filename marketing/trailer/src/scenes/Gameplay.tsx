import {Video} from '@remotion/media';
import {AbsoluteFill,CanvasImage,Easing,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Atmosphere} from '../Atmosphere';
import {colors,sans,serif} from '../theme';

export type GameplayProps={headline:string;caption:string;capture:string;clip?:string;chapter:string};
export const Gameplay=({headline,caption,capture,clip,chapter}:GameplayProps)=>{
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  return <AbsoluteFill style={{color:colors.bone,fontFamily:sans,overflow:'hidden'}}>
    <Atmosphere/>
    <div style={{position:'absolute',left:84,top:69,right:84,display:'flex',justifyContent:'space-between',fontSize:21,letterSpacing:4,color:colors.gold}}><span>ASHEN VOW</span><span>{chapter}</span></div>
    <div style={{position:'absolute',left:84,right:64,top:123,fontFamily:serif,fontSize:79,lineHeight:1.12,whiteSpace:'pre-line',opacity:interpolate(frame,[0,9],[0,1],{extrapolateRight:'clamp'}),translate:interpolate(frame,[0,16],['0px 34px','0px 0px'],{extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>{headline}</div>
    <div style={{position:'absolute',left:115,top:358,width:850,height:1511,border:'1px solid #796348',boxShadow:'0 24px 80px #000',overflow:'hidden',scale:interpolate(frame,[0,durationInFrames],[.993,1.008],{extrapolateRight:'clamp'})}}>
      {clip ? <Video name="Actual gameplay capture" src={staticFile(`clips/${clip}`)} muted objectFit="contain" style={{width:'100%',height:'100%'}}/> : <CanvasImage src={staticFile(`captures/${capture}`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
    </div>
    <div style={{position:'absolute',left:84,right:80,top:299,fontSize:40,color:'#d5c5ad',letterSpacing:1}}>{caption}</div>
  </AbsoluteFill>;
};
