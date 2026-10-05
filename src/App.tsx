import { LocationWorkspace } from './components/LocationWorkspace'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { CropSmartWorkspace } from './components/CropSmartWorkspace'
import { ChipuOverviewWorkspace } from './components/ChipuOverviewWorkspace'
import { ChipuFoundationWorkspace } from './components/ChipuFoundationWorkspace'
import { FoodResearchWorkspace } from './components/FoodResearchWorkspace'
import { PeoplePlaceWorkspace } from './components/PeoplePlaceWorkspace'
import { ResilienceWorkspace } from './components/ResilienceWorkspace'
import { EconomicsWorkspace } from './components/EconomicsWorkspace'
import { UtilityPlaceholderWorkspace } from './components/UtilityPlaceholderWorkspace'
import { DataProvenanceWorkspace } from './components/DataProvenanceWorkspace'
import { TwinStateWorkspace } from './components/TwinStateWorkspace'
import { ForecastWorkspace } from './components/ForecastWorkspace'
import { WaterIntelligenceWorkspace } from './components/WaterIntelligenceWorkspace'
import { EnergyIntelligenceWorkspace } from './components/EnergyIntelligenceWorkspace'
import { ResourceAllocationWorkspace } from './components/ResourceAllocationWorkspace'
import { ScenarioLaboratoryWorkspace } from './components/ScenarioLaboratoryWorkspace'
import { UncertaintyExplorerWorkspace } from './components/UncertaintyExplorerWorkspace'
import { ExperimentRegistryWorkspace } from './components/ExperimentRegistryWorkspace'
import { ResearchExportWorkspace } from './components/ResearchExportWorkspace'
import { ModelsMethodsWorkspace } from './components/ModelsMethodsWorkspace'
import { ModelCalibrationValidationWorkspace } from './components/ModelCalibrationValidationWorkspace'
import { FieldDataSensorWorkspace } from './components/FieldDataSensorWorkspace'
import { TelemetryGatewayWorkspace } from './components/TelemetryGatewayWorkspace'
import { ToastBridge } from './components/ToastBridge'

export default function App() {
  return <><ToastBridge/><Routes>
    <Route path="/" element={<Navigate to="/app" replace/>}/>
    <Route path="/overview" element={<Navigate to="/app" replace/>}/>
    <Route element={<AppLayout/>}>
      <Route path="/app/location" element={<LocationWorkspace/>}/>
      <Route path="/app" element={<ChipuOverviewWorkspace/>}/>
      <Route path="/app/twin" element={<TwinStateWorkspace/>}/>
      <Route path="/app/predict" element={<ForecastWorkspace/>}/>
      <Route path="/app/food" element={<FoodResearchWorkspace/>}/>
      <Route path="/app/energy" element={<EnergyIntelligenceWorkspace/>}/>
      <Route path="/app/water" element={<WaterIntelligenceWorkspace/>}/>
      <Route path="/app/people" element={<PeoplePlaceWorkspace mode="people"/>}/>
      <Route path="/app/place" element={<PeoplePlaceWorkspace mode="place"/>}/>
      <Route path="/app/control" element={<ResourceAllocationWorkspace/>}/>
      <Route path="/app/economics" element={<EconomicsWorkspace/>}/>
      <Route path="/app/resilience" element={<ResilienceWorkspace/>}/>
      <Route path="/app/data" element={<DataProvenanceWorkspace/>}/>
      <Route path="/app/reports" element={<ResearchExportWorkspace/>}/>
      <Route path="/app/settings" element={<UtilityPlaceholderWorkspace title="Settings" description="Application, data-source and model configuration will be exposed here as configuration services are added."/>}/>
      <Route path="/app/administration" element={<UtilityPlaceholderWorkspace title="Administration" description="Administrative functions remain separate from scientific modules and follow the existing protected server authorization model."/>}/>
      <Route path="/app/help" element={<UtilityPlaceholderWorkspace title="Help" description="Methods, limitations and research documentation remain available while dedicated help content is developed."/>}/>
      <Route path="/app/field-data" element={<FieldDataSensorWorkspace/>}/><Route path="/app/sensors" element={<FieldDataSensorWorkspace/>}/>
      <Route path="/app/telemetry" element={<TelemetryGatewayWorkspace/>}/><Route path="/app/ingestion-gateway" element={<TelemetryGatewayWorkspace/>}/>
      <Route path="/app/twin-state" element={<TwinStateWorkspace/>}/><Route path="/app/state" element={<TwinStateWorkspace/>}/>
      <Route path="/app/forecast" element={<ForecastWorkspace/>}/>
      <Route path="/app/resource-allocation" element={<ResourceAllocationWorkspace/>}/><Route path="/app/resources" element={<ResourceAllocationWorkspace/>}/>
      <Route path="/app/scenarios" element={<ScenarioLaboratoryWorkspace/>}/><Route path="/app/scenario-laboratory" element={<ScenarioLaboratoryWorkspace/>}/>
      <Route path="/app/uncertainty" element={<UncertaintyExplorerWorkspace/>}/><Route path="/app/uncertainty-explorer" element={<UncertaintyExplorerWorkspace/>}/>
      <Route path="/app/experiments" element={<ExperimentRegistryWorkspace/>}/><Route path="/app/experiment-registry" element={<ExperimentRegistryWorkspace/>}/>
      <Route path="/app/export" element={<ResearchExportWorkspace/>}/><Route path="/app/research-export" element={<ResearchExportWorkspace/>}/>
      <Route path="/app/methods" element={<ModelsMethodsWorkspace/>}/><Route path="/app/models-methods" element={<ModelsMethodsWorkspace/>}/>
      <Route path="/app/calibration-validation" element={<ModelCalibrationValidationWorkspace/>}/><Route path="/app/model-validation" element={<ModelCalibrationValidationWorkspace/>}/>
      <Route path="/app/farm" element={<CropSmartWorkspace screen="twin"/>}/>
      <Route path="/app/agrivoltaics" element={<CropSmartWorkspace screen="comparison"/>}/><Route path="/app/comparison" element={<CropSmartWorkspace screen="comparison"/>}/>
      <Route path="/app/crops" element={<CropSmartWorkspace screen="crop"/>}/><Route path="/app/crop" element={<CropSmartWorkspace screen="crop"/>}/>
      <Route path="/app/storage" element={<CropSmartWorkspace screen="storage"/>}/><Route path="/app/about" element={<CropSmartWorkspace screen="about"/>}/><Route path="/app/research-home" element={<CropSmartWorkspace screen="home"/>}/>
      <Route path="/app/*" element={<Navigate to="/app" replace/>}/>
    </Route>
  </Routes></>
}
