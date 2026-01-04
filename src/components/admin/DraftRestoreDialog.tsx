'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FileArchive, Clock, X } from 'lucide-react'

interface DraftRestoreDialogProps {
  isOpen: boolean
  draftTime: number
  onRestore: () => void
  onDiscard: () => void
  onCancel: () => void
  t: (key: string) => string
}

export function DraftRestoreDialog({
  isOpen,
  draftTime,
  onRestore,
  onDiscard,
  onCancel,
  t,
}: DraftRestoreDialogProps) {
  function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background border border-border shadow-2xl rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileArchive className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl">
                  {t('admin.draft_found')}
                </h3>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.draft_found_message')}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Clock className="w-4 h-4" />
                <span>{t('admin.draft_time')}: {formatTime(draftTime)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20">
              <button
                onClick={onDiscard}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('admin.draft_discard')}
              </button>
              <button
                onClick={onRestore}
                className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all rounded-md"
              >
                {t('admin.draft_restore')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}