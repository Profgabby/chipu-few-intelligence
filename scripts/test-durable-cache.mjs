import {strict as assert} from 'node:assert'
import {createDurableCache} from '../api/durable-cache.mjs'
const records=new Map()
const fetcher=async(_url,opts)=>{
 const [cmd,key,value]=JSON.parse(opts.body)
 if(cmd==='GET')return {ok:true,json:async()=>({result:records.get(key)??null})}
 if(cmd==='SET'){records.set(key,value);return {ok:true,json:async()=>({result:'OK'})}}
 throw Error('Unexpected Redis command')
}
const cache=createDurableCache({url:'https://redis.example.test',token:'test',fetcher})
const data={days:[{date:'2026-01-01',precipitationMm:2,irradiationKwhM2:3}],provenance:{provider:'NASA POWER'}}
await cache.set('fixture',data,3600)
assert.deepEqual(await cache.get('fixture'),data)
assert.equal(await cache.get('absent'),null)
assert.equal(createDurableCache({url:'',token:''}),null)
console.log('Durable cache contract PASS',JSON.stringify({passed:true,cases:4,backend:'MOCK_REDIS',liveConnection:false}))
