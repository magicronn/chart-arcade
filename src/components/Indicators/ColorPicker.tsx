interface ColorPickerProps {
  selectedColor: string
  onChange: (color: string) => void
}

// 8 colors matching the app theme
export const INDICATOR_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#22c55e', // green
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

export function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {INDICATOR_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
            selectedColor === color
              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-arcade-dark ring-gray-400'
              : ''
          }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}

export default ColorPicker
