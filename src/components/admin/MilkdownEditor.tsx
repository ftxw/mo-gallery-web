'use client'

import React, { useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './milkdown-editor.css'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface MilkdownEditorHandle {
  getValue: () => string
  insertMarkdown: (markdown: string) => void
}

export const MilkdownEditor = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    const divRef = useRef<HTMLDivElement>(null)
    const crepeRef = useRef<Crepe | null>(null)
    const loadingRef = useRef(false)
    const currentValueRef = useRef(value)
    const isInitializedRef = useRef(false)

    // Update current value ref when value changes externally
    useLayoutEffect(() => {
      currentValueRef.current = value
    }, [value])

    // Initialize Crepe editor
    useLayoutEffect(() => {
      if (!divRef.current || loadingRef.current) return

      loadingRef.current = true
      
      const crepe = new Crepe({
        root: divRef.current,
        defaultValue: value || '',
      })

      // Listen for content changes using the correct API
      // The callback receives (ctx, markdown) where ctx is the Milkdown context
      crepe.on((listener) => {
        listener.markdownUpdated((ctx, markdown) => {
          if (isInitializedRef.current) {
            currentValueRef.current = markdown
            onChange(markdown)
          }
        })
      })

      crepe.create().then(() => {
        loadingRef.current = false
        isInitializedRef.current = true
        crepeRef.current = crepe
        console.log('Crepe editor created successfully')
      }).catch((err) => {
        console.error('Failed to create Crepe editor:', err)
        loadingRef.current = false
      })

      return () => {
        if (!loadingRef.current && crepeRef.current) {
          crepeRef.current.destroy()
          crepeRef.current = null
          isInitializedRef.current = false
        }
      }
    }, []) // Only run once on mount

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getValue: () => currentValueRef.current,
      insertMarkdown: (markdown: string) => {
        const newContent = currentValueRef.current + markdown
        currentValueRef.current = newContent
        onChange(newContent)
      },
    }))

    return (
      <div 
        ref={divRef} 
        className="milkdown-crepe-editor h-full"
        data-placeholder={placeholder || '开始输入...'}
      />
    )
  }
)

MilkdownEditor.displayName = 'MilkdownEditor'

export default MilkdownEditor