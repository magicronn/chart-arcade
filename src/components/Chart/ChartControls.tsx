import { useSettingsStore } from '@/stores/settingsStore'

// Access the chart instance for zoom control
let chartZoomIn: (() => void) | null = null
let chartZoomOut: (() => void) | null = null
let chartResetZoom: (() => void) | null = null

export function setChartZoomHandlers(
  zoomIn: () => void,
  zoomOut: () => void,
  resetZoom: () => void
) {
  chartZoomIn = zoomIn
  chartZoomOut = zoomOut
  chartResetZoom = resetZoom
}

export function ChartControls() {
  const { showVolume, toggleShowVolume } = useSettingsStore()

  const handleZoomIn = () => {
    chartZoomIn?.()
  }

  const handleZoomOut = () => {
    chartZoomOut?.()
  }

  const handleResetZoom = () => {
    chartResetZoom?.()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Zoom Controls */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          onClick={handleZoomOut}
          className="px-3 py-1.5 text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Zoom out (show more bars)"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1.5 text-xs font-medium transition-colors border-l border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Reset zoom (fit all data)"
        >
          Fit
        </button>
        <button
          onClick={handleZoomIn}
          className="px-3 py-1.5 text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Zoom in (show fewer bars)"
        >
          +
        </button>
      </div>

      {/* Volume Toggle */}
      <button
        onClick={toggleShowVolume}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          showVolume
            ? 'bg-arcade-blue text-white border-arcade-blue'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title="Toggle volume"
      >
        Vol
      </button>
    </div>
  )
}

export default ChartControls
