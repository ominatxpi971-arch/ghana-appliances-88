
"use client"

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  specs: Record<string, string>
  onChange: (specs: Record<string, string>) => void
}

export default function SpecsEditor({ specs, onChange }: Props) {
  const entries = Object.entries(specs || {})

  const add = () => {
    onChange({ ...specs, "": "" })
  }

  const update = (index: number, key: string, value: string) => {
    const newSpecs = { ...specs }
    const oldKey = entries[index]?.[0]
    if (oldKey !== undefined && oldKey !== key) {
      delete newSpecs[oldKey]
    }
    if (key) newSpecs[key] = value
    else if (oldKey) delete newSpecs[oldKey]
    onChange(newSpecs)
  }

  const remove = (key: string) => {
    const newSpecs = { ...specs }
    delete newSpecs[key]
    onChange(newSpecs)
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value], i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input
            placeholder="Spec name (e.g. Screen Size)"
            value={key}
            onChange={e => update(i, e.target.value, value)}
            className="flex-1"
          />
          <Input
            placeholder="Value (e.g. 55 inch)"
            value={value}
            onChange={e => update(i, key, e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => remove(key)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
        <Plus className="h-3 w-3" /> Add Specification
      </Button>
    </div>
  )
}
