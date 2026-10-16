/** HYDRUS 4.17 atmospheric record schema: serialization is intentionally template-gated. */
export const ATMOSPH_417_COLUMNS=['tAtm','Prec','rSoil','rRoot','hCritA','rB','hB','ht','tTop','tBot','Ampl','cTop','cBot'] as const
export type Atmosph417Row=Record<(typeof ATMOSPH_417_COLUMNS)[number],number>
export type Atmosph417Template={version:'4.17.0140';sourceReference:string;headerLines:string[];recordColumnOrder:string[];verifiedWithHydrus:boolean}
export function validate417Template(t:Atmosph417Template){
 if(t.version!=='4.17.0140'||!t.sourceReference?.trim()||!t.verifiedWithHydrus)throw Error('HYDRUS 4.17.0140 verified template required')
 if(t.recordColumnOrder.join('|')!==ATMOSPH_417_COLUMNS.join('|'))throw Error('HYDRUS atmospheric column mismatch')
 if(!t.headerLines.length||t.headerLines.some(s=>typeof s!=='string'||!s.trim()))throw Error('HYDRUS header required')
 return true
}
export function serialize417Records(rows:Atmosph417Row[]){
 if(!rows.length)throw Error('No HYDRUS atmospheric records')
 let last=-Infinity
 return rows.map(r=>{
  const vals=ATMOSPH_417_COLUMNS.map(k=>r[k])
  if(vals.some(v=>!Number.isFinite(v))||r.tAtm<=last||r.tAtm<0||r.Prec<0||r.rSoil<0||r.rRoot<0)throw Error('Invalid HYDRUS time or atmospheric flux')
  last=r.tAtm
  return vals.map(v=>v.toExponential(9)).join(' ')
 }).join('\n')+'\n'
}
export function parse417Records(text:string):Atmosph417Row[]{
 const lines=text.trim().split(/\r?\n/)
 return lines.map(line=>{
  const parts=line.trim().split(/\s+/)
  if(parts.length!==13)throw Error('Expected 13 HYDRUS atmospheric columns')
  const vals=parts.map(Number)
  if(vals.some(v=>!Number.isFinite(v)))throw Error('Invalid HYDRUS numeric record')
  return Object.fromEntries(ATMOSPH_417_COLUMNS.map((key,i)=>[key,vals[i]])) as Atmosph417Row
 })
}
/** Never fabricate auxiliary HYDRUS values or atmospheric header switches. */
export function renderAtmosph417(t:Atmosph417Template,rows:Atmosph417Row[]){
 validate417Template(t)
 const records=serialize417Records(rows)
 const parsed=parse417Records(records)
 if(parsed.length!==rows.length)throw Error('HYDRUS round trip failed')
 return t.headerLines.join('\n')+'\n'+records
}
