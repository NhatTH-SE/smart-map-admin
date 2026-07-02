import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { mapApi } from '../api/mapApi'

/**
 * Modal sinh & preview code C++ cho ESP32 (Module 6).
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - mapId: Long (bắt buộc)
 *   - mapName: string (chỉ để hiển thị)
 *
 * Flow:
 *   1. Mở → gọi mapApi.exportCpp(mapId) để lấy text.
 *   2. Hiện preview (textarea monospace, read-only).
 *   3. Có 2 action: "Copy" và "Tải về .cpp".
 */
export default function ExportCodeModal({ open, onClose, mapId, mapName }) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [filename, setFilename] = useState('stations.cpp')
  const [stationCount, setStationCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  // Mỗi lần mở modal với 1 mapId → load lại code mới nhất.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !mapId) return
    let alive = true
    setLoading(true)
    setError('')
    mapApi.exportCpp(mapId)
      .then((res) => {
        if (!alive) return
        setCode(res.text || '')
        setFilename(res.filename || `map_${mapId}_stations.cpp`)
        setStationCount(res.stationCount || 0)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || 'Không sinh được code C++')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, mapId])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(`Đã copy ${code.length.toLocaleString()} ký tự`)
    } catch {
      // Fallback cho môi trường không có Clipboard API (VD: HTTP không phải localhost)
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        toast.success('Đã copy')
      } catch {
        toast.error('Copy thất bại — hãy copy thủ công')
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Đã tải ${filename}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bg-soft border border-border-strong shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400 mb-1">
              Module 06 — Code Generator
            </p>
            <h2 className="text-base font-semibold text-text">Export C++ Configuration</h2>
            {mapName && (
              <p className="text-xs text-text-soft mt-1">
                Bản đồ: <span className="font-mono text-text-soft">{mapName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-border"
            aria-label="Đóng"
          >×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Status row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-soft">
              {loading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-border-strong border-t-accent-500 animate-spin mr-2 align-middle" />
                  Đang sinh mã…
                </>
              ) : error ? (
                <span className="text-red-600">{error}</span>
              ) : (
                <>
                  Mảng <span className="font-mono text-text">cac_tram[]</span> có{' '}
                  <span className="font-mono font-semibold text-text">{stationCount + 1}</span> phần tử (gồm 1 gốc 0,0)
                </>
              )}
            </span>
            <span className="text-text-muted font-mono">{filename}</span>
          </div>

          {/* Preview */}
          <div className="border border-border-strong bg-bg-raised flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-text-soft">
                Preview
              </span>
              {!loading && code && (
                <span className="text-[10px] text-text-muted font-mono">
                  {code.split('\n').length - 1} dòng · {code.length} bytes
                </span>
              )}
            </div>
            <textarea
              readOnly
              value={code}
              spellCheck={false}
              className="flex-1 w-full px-4 py-3 font-mono text-xs text-text bg-bg-raised resize-none focus:outline-none"
              placeholder={loading ? 'Đang tải…' : 'Chưa có dữ liệu'}
            />
          </div>

          {/* Hint */}
          <p className="text-xs text-text-soft leading-relaxed">
            Copy đoạn code và chèn vào <code className="bg-bg-raised px-1.5 py-0.5 font-mono">main.cpp</code> của
            firmware ESP32, hoặc tải về để chép vào project Arduino. File sinh ra gồm
            <span className="font-mono"> cac_tram[]</span> (tọa độ) và <span className="font-mono">ten_tram[]</span>
            (tên trạm tương ứng). Index 0 của <span className="font-mono">ten_tram</span> là{' '}
            <span className="font-mono">"Không xác định"</span>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 px-6 py-4 border-t border-border bg-bg-raised shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            Đóng
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !code}
              className="btn-secondary"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !code}
              className="btn-primary"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
              </svg>
              Tải về .cpp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}