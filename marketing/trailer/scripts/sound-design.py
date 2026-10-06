"""Original one-shot cinematic effects. No melodies, pads or instrumental score."""
from pathlib import Path
import wave
import numpy as np

root=Path(__file__).resolve().parents[1]
rate=48000
length=30
rng=np.random.default_rng(61317)
mix=np.zeros((rate*length,2),dtype=np.float64)

with wave.open(str(root/'public/audio/ambient-source.wav'),'rb') as f:
    ambient=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
mix[:len(ambient)]+=ambient*.6

def envelope(duration,attack=.004,decay=.3):
    t=np.arange(int(duration*rate))/rate
    return t, np.minimum(1,t/attack)*np.exp(-t/decay)*np.minimum(1,(duration-t)/.025)

def place(audio,start,gain=1,pan=0,echo=False):
    audio=np.asarray(audio,dtype=np.float64)
    stereo=np.column_stack((audio*np.sqrt((1-pan)/2),audio*np.sqrt((1+pan)/2)))
    begin=int(start*rate)
    end=min(len(mix),begin+len(stereo))
    if begin>=0 and begin<len(mix):mix[begin:end]+=stereo[:end-begin]*gain
    if echo:
        for delay,amount in [(.12,.13),(.28,.07),(.46,.04)]:
            at=begin+int(delay*rate)
            end=min(len(mix),at+len(stereo))
            if at<len(mix):mix[at:end]+=stereo[:end-at,::-1]*gain*amount

def bell():
    t=np.arange(5*rate)/rate
    a=np.zeros_like(t)
    for freq,amp,decay in [(54,.32,2.7),(137,.30,1.8),(241,.23,1.1),(398,.09,.9),(719,.03,.4)]:
        a+=amp*np.cos(2*np.pi*freq*t+.2)*np.exp(-t/decay)
    return a*np.minimum(1,t/.003)*np.minimum(1,(5-t)/.3)

def impact():
    t,e=envelope(.9,decay=.18)
    body=np.sin(2*np.pi*(72*t-20*t*t))*e*.4
    metal=sum(a*np.sin(2*np.pi*f*t)*np.exp(-t/d) for f,a,d in [(1170,.13,.13),(1763,.10,.18),(2417,.05,.08)])
    contact=rng.normal(0,1,len(t))*np.exp(-t/.006)*.12
    return body+metal+contact

def airy_pass():
    n=int(.45*rate)
    noise=rng.normal(0,1,n)
    low=np.convolve(noise,np.ones(24)/24,'same')
    return low*np.sin(np.linspace(0,np.pi,n))**2*.12

def paper():
    n=int(.23*rate)
    noise=rng.normal(0,1,n)
    soft=np.convolve(noise,np.ones(8)/8,'same')
    return soft*np.sin(np.linspace(0,np.pi,n))**2*.045

place(bell(),.05,.7,echo=True)
place(impact(),1.96,.85,-.1,True)
place(impact(),2.37,.50,.18,True)
cuts=[6.4,10.0,13.6,17.2,20.4,23.0,25.4,28.2]
for i,time in enumerate(cuts):place(airy_pass(),time-.12,.75,(-1 if i%2 else 1)*.25)
for time in [10.20,13.85,17.45,23.22]:place(paper(),time,.85,.10,True)
place(impact(),20.65,.28,.12,True)
place(bell(),28.15,.42,echo=True)
fade=np.minimum(1,np.arange(len(mix))/int(.03*rate))*np.minimum(1,(len(mix)-np.arange(len(mix)))/int(.45*rate))
mix*=fade[:,None]
peak=float(np.max(np.abs(mix)))
if peak>.82:mix*=.82/peak
pcm=(np.clip(mix,-1,1)*32767).round().astype('<i2')
out=root/'public/audio/trailer-sound-design.wav'
with wave.open(str(out),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes(pcm.tobytes())
print(f'30s stereo original sound design; peak {np.max(np.abs(mix)):.4f}; RMS {20*np.log10(np.sqrt(np.mean(mix**2))):.2f} dBFS')
