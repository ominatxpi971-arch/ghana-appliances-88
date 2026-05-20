import { NextRequest, NextResponse } from "next/server"
import { getPosts, getPublishedPosts, createPost } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const published = searchParams.get("published")
  const posts = published === "true" ? await getPublishedPosts() : await getPosts()
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}