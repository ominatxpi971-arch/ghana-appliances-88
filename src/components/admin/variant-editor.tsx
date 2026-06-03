"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductVariant } from "@/lib/types"

interface VariantEditorProps {
  variants: Partial<ProductVariant>[]
  onChange: (variants: Partial<ProductVariant>[]) => void
}

export default function VariantEditor({ variants, onChange }: VariantEditorProps) {
  const [opt1Name, setOpt1Name] = useState(variants[0]?.option1_name || "")
  const [opt2Name, setOpt2Name] = useState(variants[0]?.option2_name || "")
  const [opt1Values, setOpt1Values] = useState("")
  const [opt2Values, setOpt2Values] = useState("")

  const existingOpt1Vals = useMemo(() =>
    [...new Set(variants.filter(v => v.option1_value).map(v => v.option1_value!))].join(", "),
    []
  )
  const existingOpt2Vals = useMemo(() =>
    [...new Set(variants.filter(v => v.option2_value).map(v => v.option2_value!))].join(", "),
    []
  )

  const generate = () => {
    const v1 = opt1Values.split(",").map(s => s.trim()).filter(Boolean)
    const v2 = opt2Values.split(",").map(s => s.trim()).filter(Boolean)
    if (v1.length === 0 && v2.length === 0) return

    const combos: { opt1: string; opt2: string }[] = []
    if (v1.length && v2.length) {
      for (const a of v1) for (const b of v2) combos.push({ opt1: a, opt2: b })
    } else if (v1.length) {
      for (const a of v1) combos.push({ opt1: a, opt2: "" })
    } else {
      for (const b of v2) combos.push({ opt1: "", opt2: b })
    }

    const newVariants = combos.map((c, i) => {
      const nameParts: string[] = []
      if (opt1Name && c.opt1) nameParts.push(opt1Name + ": " + c.opt1)
      if (opt2Name && c.opt2) nameParts.push(opt2Name + ": " + c.opt2)
      return {
        sku: "",
        name: nameParts.join(" / ") || "",
        option1_name: opt1Name || undefined,
        option1_value: c.opt1 || undefined,
        option2_name: opt2Name || undefined,
        option2_value: c.opt2 || undefined,
        price_ghs: 0,
        stock: 0,
        image: "",
        sort_order: i,
        active: true,
      } as Partial<ProductVariant>
    })

    onChange(newVariants)
  }

  const update = (idx: number, field: string, value: any) => {
    const updated = [...variants]
    updated[idx] = { ...updated[idx], [field]: value }

    const v = updated[idx]
    const parts: string[] = []
    if (opt1Name && v.option1_value) parts.push(opt1Name + ": " + v.option1_value)
    if (opt2Name && v.option2_value) parts.push(opt2Name + ": " + v.option2_value)
    updated[idx].name = parts.join(" / ") || v.sku || ""

    onChange(updated)
  }

  const remove = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx))
  }

  const addSingle = () => {
    const item: Partial<ProductVariant> = {
      sku: "",
      name: "",
      option1_name: opt1Name || undefined,
      option1_value: undefined,
      option2_name: opt2Name || undefined,
      option2_value: undefined,
      price_ghs: 0,
      stock: 0,
      image: "",
      sort_order: variants.length,
      active: true,
    }
    onChange([...variants, item])
  }

  const hasVariants = variants.length > 0

  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg space-y-3">
        <p className="text-xs font-medium text-gray-600">
          {hasVariants ? variants.length + " variant(s) generated" : "Step 1: Define options"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Option 1 Name</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Color"
              value={opt1Name}
              onChange={e => {
                setOpt1Name(e.target.value)
                if (hasVariants) {
                  onChange(variants.map(v => ({ ...v, option1_name: e.target.value || undefined })))
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Option 2 Name (optional)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Size"
              value={opt2Name}
              onChange={e => {
                setOpt2Name(e.target.value)
                if (hasVariants) {
                  onChange(variants.map(v => ({ ...v, option2_name: e.target.value || undefined })))
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Values (comma separated)</Label>
            <Input
              className="h-8 text-xs"
              placeholder={existingOpt1Vals || "e.g. Red, Blue, Green"}
              value={opt1Values || existingOpt1Vals}
              onChange={e => setOpt1Values(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Values (comma separated)</Label>
            <Input
              className="h-8 text-xs"
              placeholder={existingOpt2Vals || "e.g. 128GB, 256GB"}
              value={opt2Values || existingOpt2Vals}
              onChange={e => setOpt2Values(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={generate}
          className="w-full"
          disabled={!opt1Values.trim() && !opt2Values.trim() && hasVariants}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {hasVariants ? "Regenerate Combinations" : "Generate Variants"}
        </Button>
      </div>

      {hasVariants && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {opt1Name && <th className="text-left px-2 py-2 font-medium text-gray-600 w-[120px]">{opt1Name}</th>}
                  {opt2Name && <th className="text-left px-2 py-2 font-medium text-gray-600 w-[120px]">{opt2Name}</th>}
                  <th className="text-left px-2 py-2 font-medium text-gray-600 w-[100px]">SKU</th>
                  <th className="text-left px-2 py-2 font-medium text-gray-600 w-[90px]">Price</th>
                  <th className="text-left px-2 py-2 font-medium text-gray-600 w-[70px]">Stock</th>
                  <th className="text-center px-2 py-2 font-medium text-gray-600 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                    {opt1Name && (
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-7 text-xs"
                          value={v.option1_value || ""}
                          onChange={e => update(idx, "option1_value", e.target.value)}
                        />
                      </td>
                    )}
                    {opt2Name && (
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-7 text-xs"
                          value={v.option2_value || ""}
                          onChange={e => update(idx, "option2_value", e.target.value)}
                        />
                      </td>
                    )}
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-7 text-xs"
                        placeholder="SKU"
                        value={v.sku || ""}
                        onChange={e => update(idx, "sku", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-7 text-xs"
                        type="number"
                        min="0"
                        value={v.price_ghs ?? 0}
                        onChange={e => update(idx, "price_ghs", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-7 text-xs"
                        type="number"
                        min="0"
                        value={v.stock ?? 0}
                        onChange={e => update(idx, "stock", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <button onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2 border-t bg-gray-50">
            <Button type="button" variant="ghost" size="sm" onClick={addSingle} className="text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </div>
        </div>
      )}

      {!hasVariants && (
        <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-lg">
          <p className="text-sm">Define options above and click "Generate Variants"</p>
        </div>
      )}
    </div>
  )
}
