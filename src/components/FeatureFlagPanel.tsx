import type { ReactNode } from 'react'
import { Sparkles, Bot } from 'lucide-react'
import { useFeatureFlags } from '../providers/FeatureFlagProvider'

export function FeatureFlagPanel() {
  const { flags, toggleFlag } = useFeatureFlags()

  const items: Array<{
    key: keyof typeof flags
    label: string
    description: string
    icon: ReactNode
  }> = [
    {
      key: 'copilot',
      label: 'Research Copilot',
      description: 'Enable grounded assistant and evidence citations',
      icon: <Bot size={16} strokeWidth={3} />,
    },
    {
      key: 'semanticSearch',
      label: 'Semantic Search',
      description: 'Build experimental vector index for queries',
      icon: <Sparkles size={16} strokeWidth={3} />,
    },
  ]

  return (
    <div className="bg-white border-3 border-black shadow-nb p-3 flex flex-col gap-2 w-full max-w-md">
      <div className="flex items-center gap-2">
        <div className="bg-black text-white px-2 py-1 text-xs font-black uppercase">Labs</div>
        <p className="text-xs font-bold text-gray-600">
          Feature flags are stored locally; defaults keep experiments off.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-start gap-3 p-2 border-2 border-black hover:-translate-y-0.5 hover:-translate-x-0.5 transition"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={!!flags[item.key]}
              onChange={() => toggleFlag(item.key)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-black uppercase">
                {item.icon}
                {item.label}
              </div>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
