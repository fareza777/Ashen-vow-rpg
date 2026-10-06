import {AbsoluteFill,CanvasImage,staticFile} from 'remotion';
import {Atmosphere} from './Atmosphere';
import {colors,sans,serif} from './theme';

export type ScreenshotProps={title:string;capture:string;number:string;detail:string};
export const StoreScreenshot=({title,capture,number,detail}:ScreenshotProps)=><AbsoluteFill style={{background:colors.ink,color:colors.bone,fontFamily:sans}}>
  <Atmosphere animated={false}/>
  <div style={{position:'absolute',left:90,right:90,top:58,display:'flex',alignItems:'center',justifyContent:'space-between',color:colors.gold,fontSize:22,letterSpacing:5}}>
    <span>ASHEN VOW</span><span style={{letterSpacing:2,fontSize:19}}>{number} / 08</span>
  </div>
  <div style={{position:'absolute',left:90,top:116,right:70,fontFamily:serif,fontSize:78,fontWeight:600,lineHeight:1.12,whiteSpace:'pre-line',letterSpacing:-1}}>{title}</div>
  <div style={{position:'absolute',left:90,top:301,width:900,height:1600,boxShadow:'0 25px 65px #000',border:'1px solid #856b4c',overflow:'hidden'}}>
    <CanvasImage src={staticFile(`captures/${capture}`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
  </div>
  <div style={{position:'absolute',right:28,top:1110,writingMode:'vertical-rl',fontSize:17,letterSpacing:4,color:'#ab9273'}}>{detail}</div>
</AbsoluteFill>;

export const FeatureGraphic=()=> <AbsoluteFill style={{background:colors.ink,color:colors.bone}}>
  <CanvasImage src={staticFile('art/vesper-banner.png')} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(9,8,10,.37),transparent 67%)'}}/>
  <div style={{position:'absolute',top:108,left:62,width:442}}>
    <div style={{fontFamily:serif,fontWeight:600,fontSize:65,lineHeight:1.09,letterSpacing:5,textShadow:'0 3px 20px #000'}}>ASHEN<br/>VOW</div>
    <div style={{marginTop:18,fontFamily:sans,fontSize:15,letterSpacing:6,color:colors.gold}}>THE HOLLOW BELOW</div>
    <div style={{width:96,height:1,background:colors.gold,marginTop:24}}/>
    <div style={{fontFamily:sans,marginTop:20,fontSize:16,color:'#dfd2bd',letterSpacing:1}}>A light that remembers.</div>
  </div>
</AbsoluteFill>;
