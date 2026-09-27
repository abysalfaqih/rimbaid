'use client'

import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MAX_RECOMMENDATIONS } from '@/lib/validations/app'

export function RecommendationsField({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else if (value.length < MAX_RECOMMENDATIONS) onChange([...value, id])
  }

  return (
    <div className="space-y-3">
      <Label>Rekomendasi Aplikasi ({value.length}/{MAX_RECOMMENDATIONS})</Label>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada aplikasi lain untuk direkomendasikan.</p>
        ) : (
          options.map((option) => {
            const checked = value.includes(option.id)
            const disabled = !checked && value.length >= MAX_RECOMMENDATIONS
            return (
              <label key={option.id} className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
                <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggle(option.id)} />
                {option.name}
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}