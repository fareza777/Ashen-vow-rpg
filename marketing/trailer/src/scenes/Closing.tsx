import {AbsoluteFill,CanvasImage,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {colors,sans,serif} from '../theme';

export const Closing=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{background:colors.ink,overflow:'hidden',color:colors.bone}}>
    <CanvasImage src={staticFile('art/vesper-banner.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'66% center',opacity:.55,scale:interpolate(f,[0,60],[1.08,1.02])}}/>
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(12,10,13,.2),rgba(12,10,13,.94) 68%)'}}/>
    <div style={{position:'absolute',left:285,top:335,width:510,height:510,overflow:'hidden',borderRadius:255,opacity:interpolate(f,[0,10],[0,1],{extrapolateRight:'clamp'})}}><CanvasImage src={staticFile('art/lantern-icon.png')} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
    <div style={{position:'absolute',top:950,left:80,right:80,textAlign:'center',fontFamily:serif,fontSize:115,lineHeight:1.06,letterSpacing:8}}>ASHEN<br/>VOW</div>
    <div style={{position:'absolute',top:1240,left:80,right:80,textAlign:'center',fontFamily:sans,fontSize:26,letterSpacing:8,color:colors.gold}}>THE HOLLOW BELOW</div>
    <div style={{position:'absolute',top:1420,left:90,right:90,textAlign:'center',fontFamily:sans,fontSize:43,lineHeight:1.4}}>Carry a light.<br/><span style={{color:colors.gold}}>Leave room for a dawn.</span></div>
    <div style={{position:'absolute',bottom:150,left:90,right:90,textAlign:'center',fontFamily:sans,fontSize:25,letterSpacing:4,color:'#c1ae92'}}>AN ORIGINAL DARK FANTASY RPG</div>
  </AbsoluteFill>;
};
