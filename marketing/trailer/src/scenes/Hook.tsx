import {AbsoluteFill,CanvasImage,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {colors,sans,serif} from '../theme';

export const Hook=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{background:colors.ink,overflow:'hidden'}}>
    <CanvasImage src={staticFile('art/bell-hook.png')} style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(f,[0,60],[1.09,1.01]),translate:interpolate(f,[0,60],['0px -18px','0px 0px'])}}/>
    <AbsoluteFill style={{background:'linear-gradient(180deg,transparent 25%,rgba(11,9,12,.3) 52%,rgba(11,9,12,.96))'}}/>
    <div style={{position:'absolute',left:90,right:90,top:1150,color:colors.bone,fontFamily:serif,fontSize:93,lineHeight:1.1,opacity:interpolate(f,[0,7],[0,1],{extrapolateRight:'clamp'}),translate:interpolate(f,[0,20],['0px 30px','0px 0px'],{extrapolateRight:'clamp'})}}>The bell has<br/>your name.</div>
    <div style={{position:'absolute',left:94,top:1417,color:colors.gold,fontFamily:sans,fontSize:46,opacity:interpolate(f,[18,28],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>Its date is tomorrow.</div>
    <div style={{position:'absolute',left:94,bottom:130,color:'#c4b7a3',fontFamily:sans,fontSize:23,letterSpacing:5}}>ASHEN VOW · THE HOLLOW BELOW</div>
  </AbsoluteFill>;
};
