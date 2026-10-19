import {prepareGlobalRun} from './global-run-service.mjs'
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'})}
 try{
  const size=Number(req.headers['content-length']||0)
  if(size>65536)return res.status(413).json({error:'Request too large'})
  const result=await prepareGlobalRun(req.body)
  res.setHeader('Cache-Control','no-store')
  return res.status(200).json(result)
 }catch(e){
  const message=e instanceof Error?e.message:'Orchestration failed'
  return res.status(/HTTP |upstream|NASA POWER/.test(message)?502:422).json({error:message})
 }
}
