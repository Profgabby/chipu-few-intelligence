import {ATMOSPH_417_COLUMNS,serialize417Records,parse417Records,renderAtmosph417,type Atmosph417Row} from './hydrus-417-records'
export function runHydrus417RecordAcceptance(){
 const base=Object.fromEntries(ATMOSPH_417_COLUMNS.map(k=>[k,0])) as Atmosph417Row
 const rows=[{...base,tAtm:1,Prec:0.5,rSoil:0.2,rRoot:0.3,hCritA:10000},{...base,tAtm:2,Prec:0.1,rSoil:0.25,rRoot:0.35,hCritA:10000}]
 const text=serialize417Records(rows)
 const parsed=parse417Records(text)
 if(parsed.length!==2||Math.abs(parsed[0].Prec-0.5)>1e-9)throw Error('HYDRUS round-trip failed')
 let rejected=0
 for(const test of [()=>parse417Records('1 2 3'),()=>serialize417Records([{...rows[0],Prec:-1}]),()=>serialize417Records([rows[1],rows[0]]),()=>renderAtmosph417({version:'4.17.0140',sourceReference:'synthetic',headerLines:['dummy'],recordColumnOrder:[...ATMOSPH_417_COLUMNS],verifiedWithHydrus:false},rows)]){
  try{test()}catch{rejected++}
 }
 if(rejected!==4)throw Error('HYDRUS invalid-input rejection failed')
 return {passed:true,cases:6,records:2,version:'4.17.0140',nativeExportCertified:false}
}
