import { NextRequest, NextResponse } from "next/server"
import { getSettings } from "@/lib/db"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    return NextResponse.json(await getSettings())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // Collect all columns that trigger "not found" errors, remove them all, then save once
    let safe: Record<string, unknown> = { id: 1, ...body }
    const skipped: string[] = []

    for (let i = 0; i < 50; i++) {
      const { error } = await supabase.from("site_settings").upsert(safe)
      if (!error) {
        const result = await getSettings()
        return NextResponse.json({ ...result, _skipped: skipped })
      }
      const m = error.message.match(/could not find the ["'](\w+)["']/i)
      if (!m) {
        return NextResponse.json({ error: error.message, _skipped: skipped }, { status: 500 })
      }
      skipped.push(m[1])
      const { [m[1]]: _, ...rest } = safe as any
      safe = rest
    }
    return NextResponse.json({ error: "Too many missing columns", _skipped: skipped }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}
