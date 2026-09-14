const URL=process.env.SUPABASE_URL
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY

export default async()=>{
  const configured=Boolean(URL&&KEY)
  if(!configured)return Response.json({status:'degraded',configured:false,databaseReachable:false,schemaReady:false},{status:503})
  try{
    const r=await fetch(`${URL}/rest/v1/cs_sensors?select=id&limit=1`,{headers:{apikey:KEY!,Authorization:`Bearer ${KEY}`}})
    if(!r.ok)return Response.json({status:'degraded',configured:true,databaseReachable:r.status<500,schemaReady:false},{status:503})
    return Response.json({status:'ok',configured:true,databaseReachable:true,schemaReady:true})
  }catch{
    return Response.json({status:'degraded',configured:true,databaseReachable:false,schemaReady:false},{status:503})
  }
}
