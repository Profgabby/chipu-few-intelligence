/** Global solver abstraction. No local installation is required for native runs. */
export const CHIPU_SOLVER_SCHEMA='chipu.solver.v0.1' as const
export type SolverBackend='CHIPU_NATIVE'|'HYDRUS_1D'|'EXTERNAL'
export type SolverCapability='WATER_BUCKET'|'ROOT_ZONE'|'RICHARDS_1D'|'CROP_GROWTH'|'PV_ENERGY'|'PUMPING_ENERGY'
export type SolverDescriptor={id:string;backend:SolverBackend;capabilities:SolverCapability[];requiresLocalInstallation:boolean;status:'AVAILABLE'|'ADAPTER_ONLY'|'NOT_IMPLEMENTED';evidence:string}
export const SOLVER_REGISTRY:SolverDescriptor[]=[
 {id:'chipu-daily-water-energy',backend:'CHIPU_NATIVE',capabilities:['WATER_BUCKET','PV_ENERGY','PUMPING_ENERGY'],requiresLocalInstallation:false,status:'AVAILABLE',evidence:'SYNTHETIC_REGRESSION_ONLY'},
 {id:'chipu-richards-1d',backend:'CHIPU_NATIVE',capabilities:['RICHARDS_1D','ROOT_ZONE'],requiresLocalInstallation:false,status:'NOT_IMPLEMENTED',evidence:'NONE'},
 {id:'hydrus-1d-417',backend:'HYDRUS_1D',capabilities:['RICHARDS_1D','ROOT_ZONE'],requiresLocalInstallation:true,status:'ADAPTER_ONLY',evidence:'RECORD_MAPPING_TESTS_ONLY'}
]
export function selectSolver(required:SolverCapability[],allowExternal=false){
 if(!required.length)throw Error('Solver capability requirements missing')
 const found=SOLVER_REGISTRY.find(s=>s.status==='AVAILABLE'&&(allowExternal||s.backend==='CHIPU_NATIVE')&&required.every(c=>s.capabilities.includes(c)))
 if(!found)throw Error('No verified implemented solver supports all requested capabilities')
 return found
}
