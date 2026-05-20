import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/gif",
]

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".gif"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    // 10MB limit on server side
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Validate MIME type
    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images allowed." }, { status: 400 })
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images allowed." }, { status: 400 })
    }

    // Validate file extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type. Only images allowed." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `${Date.now()}-${safeName}`

    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      })

    if (error) {
      return NextResponse.json(
        { error: error.message, details: JSON.stringify(error) },
        { status: 500 }
      )
    }

    if (!data?.path) {
      return NextResponse.json({ error: "Upload succeeded but no path returned" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path)
    
    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: "Failed to generate public URL" }, { status: 500 })
    }

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}