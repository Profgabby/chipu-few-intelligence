// Isolated build-time regression runner. esbuild is installed transitively by Vite.
const esbuild=require('esbuild')
const {mkdtempSync,rmSync}=require('node:fs')
const {tmpdir}=require('node:os')
const {join}=require('node:path')
const dir=mkdtempSync(join(tmpdir(),'chipu-radiation-'))
try{
 const output=join(dir,'regression.cjs')
 esbuild.buildSync({entryPoints:['src/lib/radiation-adapter-regression.ts'],bundle:true,platform:'node',format:'cjs',target:'node20',outfile:output})
 const report=require(output).runRadiationAdapterRegressionTests()
 if(!report.passed)throw Error('Radiation regression returned failure')
 process.stdout.write('Radiation acceptance gate PASS '+JSON.stringify(report)+'\n')
}catch(error){console.error('Radiation acceptance gate FAIL',error);process.exitCode=1}
finally{rmSync(dir,{recursive:true,force:true})}
