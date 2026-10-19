/** Optional durable, shared Upstash Redis REST cache. No credentials are stored in code. */
export function createDurableCache({url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN,fetcher=fetch}={}){
 if(!url||!token)return null
 const endpoint=new URL(url)
 if(endpoint.protocol!=='https:')throw Error('Durable cache must use HTTPS')
 async function command(parts){
  const response=await fetcher(endpoint.toString(),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(parts),signal:AbortSignal.timeout(8000)})
  if(!response.ok)throw Error('Durable cache HTTP '+response.status)
  const payload=await response.json()
  if(payload.error)throw Error('Durable cache operation failed')
  return payload.result
 }
 return {
  async get(key){const raw=await command(['GET','chipu:power:v1:'+key]);if(raw===null)return null;const parsed=JSON.parse(raw);if(!parsed||!Array.isArray(parsed.days)||!parsed.provenance)return null;return parsed},
  async set(key,value,ttlSeconds=21600){await command(['SET','chipu:power:v1:'+key,JSON.stringify(value),'EX',String(ttlSeconds)])}
 }
}
