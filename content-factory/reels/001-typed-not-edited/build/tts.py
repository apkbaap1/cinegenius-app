import asyncio, edge_tts, subprocess, json, sys, ssl, os
import edge_tts.communicate as _c
_ca=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt'
if os.path.exists(_ca): _c._SSL_CTX=ssl.create_default_context(cafile=_ca)  # trust the sandbox proxy CA
PROXY=os.environ.get('HTTPS_PROXY')
lines=[l.strip() for l in open('script/script.txt',encoding='utf-8') if l.strip()]
async def main():
    for i,l in enumerate(lines):
        await edge_tts.Communicate(l,'te-IN-MohanNeural',rate='+22%',proxy=PROXY).save(f'build/vo/{i:02d}.mp3')
asyncio.run(main())
t=0.1; out=[]; GAP=0.15
for i,l in enumerate(lines):
    f=f'build/vo/{i:02d}'
    # trim leading/trailing silence
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f+'.mp3','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse','-ar','48000','-ac','1',f+'.wav'],check=True)
    d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f+'.wav']))
    out.append({'i':i,'text':l,'start':round(t,3),'dur':round(d,3)}); t+=d+GAP
json.dump({'lines':out,'total':round(t+0.6,3)},open('build/timing.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
for o in out: print(o['start'],o['dur'],o['text'])
print('total',t+0.6)
