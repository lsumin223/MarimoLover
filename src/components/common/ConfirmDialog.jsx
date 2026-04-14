// 확인 다이얼로그 컴포넌트
// 삭제 등 중요한 작업 전에 사용자 확인을 받는 용도
// Modal 컴포넌트를 기반으로 구성

import Modal from './Modal'

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmText = '삭제',
  danger = true,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="확인"
      size="sm"
    >
      <div className="flex flex-col gap-5">
        {/* 메시지 */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--txm)' }}
        >
          {message}
        </p>

        {/* 버튼 영역 */}
        <div className="flex items-center justify-end gap-2">
          {/* 취소 버튼 */}
          <button
            className="btn-ghost"
            onClick={onCancel}
          >
            취소
          </button>

          {/* 확인 버튼 — danger 여부에 따라 스타일 분기 */}
          <button
            className={danger ? 'btn-danger' : 'btn-accent'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
