const {withXcodeProject,IOSConfig}=require('expo/config-plugins');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
// Generated native projects remain disposable. Link the verified GGUF as an app resource.
module.exports=function withPhoneModel(config){
  return withXcodeProject(config,c=>{
    const file=path.join(c.modRequest.projectRoot,'models/qwen2.5-0.5b-instruct-q4_k_m.gguf');
    if(!fs.existsSync(file))throw new Error('Phone model missing. Run npm run mobile:model from the repository root.');
    const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if(sha!=='74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db')throw new Error('Phone model checksum mismatch.');
    IOSConfig.XcodeUtils.ensureGroupRecursively(c.modResults,'Resources');
    IOSConfig.XcodeUtils.addResourceFileToGroup({filepath:path.relative(c.modRequest.platformProjectRoot,file),groupName:'Resources',project:c.modResults,isBuildFile:true,verbose:true});
    for(const name of ['model-notices.txt','qwen-license.txt','native-runtime-license.txt']){
      IOSConfig.XcodeUtils.addResourceFileToGroup({filepath:path.relative(c.modRequest.platformProjectRoot,path.join(c.modRequest.projectRoot,'assets',name)),groupName:'Resources',project:c.modResults,isBuildFile:true,verbose:true});
    }
    return c;
  });
};
