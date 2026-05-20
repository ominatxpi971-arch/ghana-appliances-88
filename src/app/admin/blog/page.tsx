"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, ExternalLink, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Post } from "@/lib/types"
import { toast } from "sonner"

const PAGE_SIZE = 10

const EMPTY: Partial<Post> = {
  title: "", excerpt: "", content: "", category: "General",
  tags: [], featured_image: "", author: "Ghana Appliances", published: false
}

const CATEGORIES = [
  "General", "Buying Guides", "Product Reviews", "Maintenance Tips",
  "Energy Saving", "Home Improvement", "News", "Comparisons"
]

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Post> | null>(null)
  const [page, setPage] = useState(0)
  const [tagsInput, setTagsInput] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts")
      setPosts(await res.json())
    } catch { toast.error("Failed to load posts") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSave = async () => {
    if (!editing?.title) { toast.error("Title required"); return }
    const isNew = !editing.id
    const url = isNew ? "/api/posts" : `/api/posts/${editing.id}`
    try {
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) })
      if (!res.ok) throw new Error()
      toast.success(isNew ? "Post created" : "Post updated")
      setDialogOpen(false); fetchPosts()
    } catch { toast.error("Save failed") }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/posts/${deleteTarget}`, { method: "DELETE" })
      toast.success("Post deleted")
      setDeleteTarget(null)
      fetchPosts()
    } catch { toast.error("Delete failed") }
    finally { setDeleteLoading(false) }
  }

  const handleTogglePublish = async (post: Post) => {
    setPublishingId(post.id)
    try {
      await fetch(`/api/posts/${post.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !post.published }) })
      toast.success(post.published ? "Unpublished" : "Published")
      fetchPosts()
    } catch { toast.error("Toggle failed") }
    finally { setPublishingId(null) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEditing({ ...editing, featured_image: data.url })
      toast.success("Image uploaded")
    } catch { toast.error("Upload failed") }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = "" }
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading posts...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => { setEditing({ ...EMPTY }); setTagsInput(""); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search posts..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Category</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Author</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium hidden sm:table-cell">Date</th>
              <th className="text-right p-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium truncate max-w-[300px]">{p.title}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[300px]">{p.excerpt || "No excerpt"}</p>
                </td>
                <td className="p-3 hidden md:table-cell"><Badge variant="outline">{p.category}</Badge></td>
                <td className="p-3 hidden lg:table-cell text-gray-500">{p.author}</td>
                <td className="p-3 text-center"><Badge className={p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>{p.published ? "Published" : "Draft"}</Badge></td>
                <td className="p-3 text-right hidden sm:table-cell text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {p.published && p.slug && (
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="View on site">
                        <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={publishingId === p.id} onClick={() => handleTogglePublish(p)}>
                      {publishingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing({ ...p }); setTagsInput((p.tags || []).join(", ")); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No posts found</td></tr>}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={editing?.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={editing?.category || "General"} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Author</Label>
                  <Input value={editing?.author || ""} onChange={e => setEditing({ ...editing, author: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Excerpt (shown in blog list and SEO description)</Label>
                <Textarea rows={2} value={editing?.excerpt || ""} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Content (HTML supported)</Label>
                <Textarea rows={12} value={editing?.content || ""} onChange={e => setEditing({ ...editing, content: e.target.value })} className="font-mono text-sm" />
                <Button variant="outline" size="sm" type="button" className="mt-1" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>Featured Image URL</Label>
                <div className="flex gap-2">
                  <Input className="flex-1" value={editing?.featured_image || ""} onChange={e => setEditing({ ...editing, featured_image: e.target.value })} placeholder="https://..." />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="default" type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-1" /> Upload</>}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="seo" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Tags (comma separated)</Label>
                <Input value={tagsInput} onChange={e => { setTagsInput(e.target.value); setEditing({ ...editing, tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) }) }} placeholder="e.g. air conditioner, energy saving, ghana" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (auto-generated if empty)</Label>
                <Input value={editing?.slug || ""} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder={editing?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "auto-generated"} />
              </div>
              <label className="flex items-center gap-2 text-sm pt-2">
                <input type="checkbox" checked={editing?.published || false} onChange={e => setEditing({ ...editing, published: e.target.checked })} />
                Published (visible to public)
              </label>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSave}>Save Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete post?"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Content Preview</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: editing?.content || "<p class='text-gray-400 italic'>No content to preview</p>" }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
