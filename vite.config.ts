import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { runRadiationAdapterRegressionTests } from './src/lib/radiation-adapter-regression'

// Fail production-like builds when geometry/radiation invariants regress.
export default defineConfig(({command}) => {
  if(command==='build') {
    const report=runRadiationAdapterRegressionTests()
    if(!report.passed) throw Error('Radiation regression gate failed')
  }
  return {
    plugins: [react()],
    server: {allowedHosts: true, port: 3000, host: '0.0.0.0'},
    preview: {port: 4173, host: '0.0.0.0'},
  }
})
