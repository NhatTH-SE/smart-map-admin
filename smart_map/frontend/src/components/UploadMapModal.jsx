import { useEffect, useRef, useState } from 'react'
import { mapApi } from '../api/mapApi'

export default function UploadMapModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleClose = () => {
    setFile(null); setName(''); setDescription(''); setPreviewUrl(null)
    setError(''); setSubmitting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose?.()
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) handleClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Vui lòng chọn file ảnh (PNG, JPG, WEBP)'); return }
    if (f.size > 20 * 1024 * 1024) { setError('File ảnh vượt quá 20MB'); return }
    setError(''); setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Vui lòng chọn ảnh bản đồ')
    if (!name.trim()) return setError('Vui lòng nhập tên bản đồ')
    setSubmitting(true); setError('')
    try {
      await mapApi.create(file, name.trim(), description.trim())
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err.message || 'Upload thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bg-soft border border-border-strong shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400 mb-1">Floorplan</p>
            <h2 className="text-base font-semibold text-text">Upload bản đồ</h2>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-border" aria-label="Đóng">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="label">Ảnh sơ đồ (Floorplan) <span className="text-red-600 normal-case">*</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="block w-full text-sm text-text-soft file:mr-3 file:py-2 file:px-4 file:bg-bg-raised file:text-text-soft file:border file:border-border-strong hover:file:bg-border cursor-pointer"
            />
            <p className="text-xs text-text-soft mt-1.5">PNG, JPG, WEBP — tối đa 20MB.</p>
          </div>

          {previewUrl && (
            <div className="border border-border bg-bg-raised p-2">
              <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain" />
            </div>
          )}

          <div>
            <label className="label">Tên bản đồ <span className="text-red-600 normal-case">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="VD: Tầng 1 - Tòa A"
              className="input"
            />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Mô tả ngắn về bản đồ (không bắt buộc)"
              className="input resize-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-danger-soft/15 border border-danger text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={handleClose} disabled={submitting} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />}
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}