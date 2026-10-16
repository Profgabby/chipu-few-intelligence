// Node 24 native TypeScript stripping; isolate source modules and resolve explicit .ts paths.
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {pathToFileURL}=require('node:url')
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chipu-radiation-'))
;(async()=>{
 try{
  for(const name of ['geometry-registry','radiation-forcing-adapter','radiation-adapter-regression','treatment-microclimate-forcing','fao56-penman-monteith','hydrus-atmospheric-contract','paired-daily-acceptance','av-timeseries-engine','avModelLaboratory','predata-scientific-baselines','crop-registry','hydrus-atmosph-exporter','multicrop-acceptance','hydrus-417-records','hydrus-417-records-acceptance']){
   let source=fs.readFileSync(path.join('src/lib',name+'.ts'),'utf8')
   source=source.replaceAll("'./geometry-registry'","'./geometry-registry.ts'").replaceAll("'./radiation-forcing-adapter'","'./radiation-forcing-adapter.ts'")
   source=source.replaceAll("'./treatment-microclimate-forcing'","'./treatment-microclimate-forcing.ts'")
   source=source.replaceAll("'./fao56-penman-monteith'","'./fao56-penman-monteith.ts'")
   source=source.replaceAll("'./hydrus-atmospheric-contract'","'./hydrus-atmospheric-contract.ts'")
   for(const dep of ['paired-daily-acceptance','av-timeseries-engine','avModelLaboratory','predata-scientific-baselines'])source=source.replaceAll("'./"+dep+"'","'./"+dep+".ts'")
   for(const dep of ['crop-registry','hydrus-atmosph-exporter','multicrop-acceptance'])source=source.replaceAll("'./"+dep+"'","'./"+dep+".ts'")
   for(const dep of ['hydrus-417-records','hydrus-417-records-acceptance'])source=source.replaceAll("'./"+dep+"'","'./"+dep+".ts'")
   fs.writeFileSync(path.join(dir,name+'.ts'),source)
  }
  const suite=await import(pathToFileURL(path.join(dir,'radiation-adapter-regression.ts')).href)
  const report=suite.runRadiationAdapterRegressionTests()
  if(!report.passed)throw Error('Radiation regression returned failure')
  const paired=(await import(pathToFileURL(path.join(dir,'paired-daily-acceptance.ts')).href)).runPairedDailyAcceptance()
  if(!paired.passed)throw Error('Paired simulation regression failed')
  const multicrop=(await import(pathToFileURL(path.join(dir,'multicrop-acceptance.ts')).href)).runMultiCropAcceptance()
  if(!multicrop.passed)throw Error('Multi-crop acceptance failed')
  const hydrus=(await import(pathToFileURL(path.join(dir,'hydrus-417-records-acceptance.ts')).href)).runHydrus417RecordAcceptance()
  if(!hydrus.passed)throw Error('HYDRUS record acceptance failed')
  process.stdout.write('HYDRUS record acceptance PASS '+JSON.stringify(hydrus)+'\n')
  process.stdout.write('Multi-crop acceptance PASS '+JSON.stringify(multicrop)+'\n')
  process.stdout.write('Paired daily acceptance PASS '+JSON.stringify(paired)+'\n')
  process.stdout.write('Radiation acceptance gate PASS '+JSON.stringify(report)+'\n')
 }catch(error){console.error('Radiation acceptance gate FAIL',error);process.exitCode=1}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
})()
