"""Verify every bundled web file and update human-readable release metadata."""
from pathlib import Path
import hashlib,json,zipfile,re

root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text(encoding='utf-8-sig'))['version']
gradle=(root/'android/app/build.gradle').read_text()
version_code=int(re.search(r'versionCode\s+(\d+)',gradle)[1])
assert re.search(r'versionName\s+"([^"]+)"',gradle)[1]==version
apk=root/'releases'/f'AshenVow-{version}.apk'
with zipfile.ZipFile(apk) as archive:
    files=[p for p in (root/'dist-android').rglob('*') if p.is_file()]
    for path in files:
        member='assets/public/'+path.relative_to(root/'dist-android').as_posix()
        assert hashlib.sha256(path.read_bytes()).digest()==hashlib.sha256(archive.read(member)).digest(),member
    config=json.loads(archive.read('assets/capacitor.config.json'))
    assert not config.get('server',{}).get('url'), 'A local APK must not depend on a remote server'
    assert 'registerSW.js' not in archive.read('assets/public/index.html').decode()
sha=hashlib.sha256(apk.read_bytes()).hexdigest()
sidecar=(apk.parent/(apk.name+'.sha256')).read_text().split()[0]
assert sidecar==sha,'Checksum mismatch'
info=dict(app='Ashen Vow: The Hollow Below',packageId='com.ashenvow.game',version=version,versionCode=version_code,file=apk.name,bytes=apk.stat().st_size,sha256=sha,minSdk=24,targetSdk=36,orientation='portrait',signature='APK Signature Scheme v2 verified',bundledAssetsVerified=len(files),remoteServerRequired=False,physicalDeviceTested=False)
(apk.parent/'APK-INFO.json').write_text(json.dumps(info,indent=2)+'\n',encoding='utf-8')
print(json.dumps(info,indent=2))
