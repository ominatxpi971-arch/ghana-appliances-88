import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sb = createAdminClient()

  // Guest profiles (synthetic from orders) have id starting with "guest-"
  // They cannot be deleted from auth
  if (id.startsWith("guest-")) {
    return NextResponse.json({ success: true, deleted: id })
  }

  // Registered user: delete from Supabase Auth
  try {
    const { error } = await sb.auth.admin.deleteUser(id)
    if (error) {
      console.error("Delete user error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also try to remove from profiles table if it exists
    try {
      await sb.from("profiles").delete().eq("user_id", id)
    } catch { /* profiles table may not exist */ }

    return NextResponse.json({ success: true, deleted: id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}