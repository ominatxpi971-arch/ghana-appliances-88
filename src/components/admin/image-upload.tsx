"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      let { width, height } = img
      if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth }
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        const compressed = new File([blob], file.name, { type: "image/jpeg" })
        resolve(compressed.size < file.size ? compressed : file)
      }, "image/jpeg", quality)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

export default function ImageUpload({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB")
      return
    }

    setUploading(true)
    setUploadProgress("Compressing...")

    try {
      // Compress image before upload
      const compressed = await compressImage(file)
      setUploadProgress(`Uploading (${(compressed.size / 1024).toFixed(0)}KB)...`)

      const formData = new FormData()
      formData.append("file", compressed)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const text = await res.text()

      let data: any = {}
      try { data = JSON.parse(text) } catch { /* response is not JSON */ }

      if (!res.ok) {
        const errMsg = data.error || data.details || text.substring(0, 300) || `HTTP ${res.status}`
        toast.error(`Upload failed: ${errMsg}`)
        throw new Error(errMsg)
      }

      if (!data.url) {
        toast.error(`Upload succeeded but no URL returned. Response: ${JSON.stringify(data).substring(0, 200)}`)
        throw new Error("No URL returned")
      }

      onChange([...images, data.url])
      toast.success("Image uploaded successfully")
    } catch (err: any) {
      if (!err.message?.includes("Upload failed")) {
        toast.error(err.message || "Upload failed — please try again")
      }
    } finally {
      setUploading(false)
      setUploadProgress("")
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const remove = (index: number) => { onChange(images.filter((_, i) => i !== index)) }

  const moveUp = (index: number) => {
    if (index === 0) return
    const copy = [...images]
    ;[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]
    onChange(copy)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative group h-24 w-24 border rounded-lg overflow-hidden bg-gray-100">
            <img
              src={url}
              alt={`Product image ${i + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              {i > 0 && (
                <button type="button" onClick={() => moveUp(i)} className="text-white text-xs bg-black/50 px-1 rounded" title="Move left">
                  ←
                </button>
              )}
              <button type="button" onClick={() => remove(i)} className="text-white bg-red-500/80 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[10px] text-center py-0.5">
                Cover
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <span className="text-[10px] text-gray-400 text-center leading-tight">{uploadProgress || "Uploading..."}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-400">Add Image</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      <p className="text-xs text-gray-400">
        Click to upload. First image is the cover. Max 10MB — images are compressed automatically.
      </p>
    </div>
  )
}
