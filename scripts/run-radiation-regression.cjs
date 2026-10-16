// Node 24 native TypeScript stripping; isolate source modules and resolve explicit .ts paths.
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {pathToFileURL}=require('node:url')
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chipu-radiation-'))
;(async()=>{
 try{
  for(const name of ['geometry-registry','radiation-forcing-adapter','radiation-adapter-regression']){
   let source=fs.readFileSync(path.join('src/lib',name+'.ts'),'utf8')
   source=source.replaceAll("'./geometry-registry'","'./geometry-registry.ts'").replaceAll("'./radiation-forcing-adapter'","'./radiation-forcing-adapter.ts'")
   fs.writeFileSync(path.join(dir,name+'.ts'),source)
  }
  const suite=await import(pathToFileURL(path.join(dir,'radiation-adapter-regression.ts')).href)
  const report=suite.runRadiationAdapterRegressionTests()
  if(!report.passed)throw Error('Radiation regression returned failure')
  process.stdout.write('Radiation acceptance gate PASS '+JSON.stringify(report)+'\n')
 }catch(error){console.error('Radiation acceptance gate FAIL',error);process.exitCode=1}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
})()
