import { useRestoreWindow } from '../hooks/useRestoreWindow'

/**
 * Một dòng trong danh sách "Đã xóa gần đây".
 * Nếu còn trong cửa sổ 30s: hiển thị nút Khôi phục + đếm ngược.
 * Sau 30s: chỉ hiện label "Đã xóa vĩnh viễn", nút biến mất.
 */
export default function RestoreRow({
  item,
  onRestore,
  isRestoring,
  primary,
  meta,
  windowSeconds = 30,
}) {
  const { secondsLeft, isExpired } = useRestoreWindow(item.deletedAt, windowSeconds)

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      {primary && (
        <div
          className="w-10 h-10 bg-bg-raised border border-border shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${primary})` }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-text truncate">{item.name}</div>
        <div className="text-[11px] text-text-soft font-mono flex items-center gap-1.5">
          <span>{meta}</span>
          {isExpired ? (
            <span className="text-text-muted">· Đã xóa vĩnh viễn</span>
          ) : (
            <span className="text-amber-700">
              · Còn {secondsLeft}s để khôi phục
            </span>
          )}
        </div>
      </div>
      {isExpired ? (
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted px-2 py-1 border border-border">
          Hết hạn
        </span>
      ) : (
        <button
          onClick={() => onRestore(item)}
          disabled={isRestoring}
          className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50"
        >
          {isRestoring ? 'Đang khôi phục...' : 'Khôi phục'}
        </button>
      )}
    </li>
  )
}
