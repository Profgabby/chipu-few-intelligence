// Execute TypeScript regression modules with the project's direct TypeScript dependency.
const ts=require('typescript')
const fs=require('node:fs')
require.extensions['.ts']=(module,filename)=>{
 const source=fs.readFileSync(filename,'utf8')
 const compiled=ts.transpileModule(source,{fileName:filename,compilerOptions:{module:1,target:9,esModuleInterop:true}})
 module._compile(compiled.outputText,filename)
}
try{
 const report=require('../src/lib/radiation-adapter-regression.ts').runRadiationAdapterRegressionTests()
 if(!report.passed)throw Error('Radiation regression returned failure')
 process.stdout.write('Radiation acceptance gate PASS '+JSON.stringify(report)+'\n')
}catch(error){console.error('Radiation acceptance gate FAIL',error);process.exitCode=1}
