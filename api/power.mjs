import {retrievePower} from './power-service.mjs'
/** Public read-only Vercel function: daily point data only, no simulation claims. */
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
 try{
  const {latitude,longitude,start,end}=req.query
  const result=await retrievePower({latitude:Number(latitude),longitude:Number(longitude),start,end})
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=3600')
  return res.status(200).json(result)
 }catch(error){
  const message=error instanceof Error?error.message:'Environmental provider error'
  const invalid=message.startsWith('Invalid')
  return res.status(invalid?400:502).json({error:message})
 }
}
