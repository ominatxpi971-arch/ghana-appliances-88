import { NextRequest, NextResponse } from "next/server"
import { getPostById, updatePost, deletePost } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const p = await getPostById(id)
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json()
  const p = await updatePost(id, body)
  return NextResponse.json(p)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await deletePost(id)
  return NextResponse.json({ success: true })
}
