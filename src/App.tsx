import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { CropSmartWorkspace } from './components/CropSmartWorkspace'
import { DataProvenanceWorkspace } from './components/DataProvenanceWorkspace'
import { TwinStateWorkspace } from './components/TwinStateWorkspace'
import { ToastBridge } from './components/ToastBridge'

const screens = [
  ['farm', 'twin'],
  ['forecast', 'forecast'],
  ['water', 'water'],
  ['energy', 'energy'],
  ['agrivoltaics', 'comparison'],
  ['crops', 'crop'],
  ['storage', 'storage'],
  ['scenarios', 'scenarios'],
  ['uncertainty', 'uncertainty'],
  ['resource-allocation', 'resources'],
  ['experiments', 'experiments'],
  ['export', 'export'],
  ['methods', 'methods'],
  ['about', 'about'],
] as const

export default function App() {
  return (
    <>
      <ToastBridge />

      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<CropSmartWorkspace screen="home" />} />
          <Route path="/app/data" element={<DataProvenanceWorkspace />} />
          <Route path="/app/twin-state" element={<TwinStateWorkspace />} />
          <Route path="/app/state" element={<TwinStateWorkspace />} />

          {screens.map(([path, screen]) => (
            <Route key={path} path={`/app/${path}`} element={<CropSmartWorkspace screen={screen} />} />
          ))}

          <Route path="/app/twin" element={<CropSmartWorkspace screen="twin" />} />
          <Route path="/app/comparison" element={<CropSmartWorkspace screen="comparison" />} />
          <Route path="/app/crop" element={<CropSmartWorkspace screen="crop" />} />
          <Route path="/app/resources" element={<CropSmartWorkspace screen="resources" />} />
          <Route path="/app/*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>
    </>
  )
}
