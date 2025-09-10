'use client'

import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderContent = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g)
    
    return parts.map((part, index) => {
      // Every third element starting from index 2 is code content
      if ((index - 2) % 3 === 0 && index > 0) {
        const language = parts[index - 1] || ''
        return (
          <div key={index} className="my-4 bg-muted border rounded-lg overflow-hidden">
            {language && (
              <div className="px-3 py-1 bg-muted-foreground/10 text-xs font-mono text-muted-foreground border-b">
                {language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code className="font-mono text-sm text-foreground leading-relaxed">
                {part.trim()}
              </code>
            </pre>
          </div>
        )
      }
      
      // Skip language identifiers
      if ((index - 1) % 3 === 0 && index > 0) {
        return null
      }
      
      // Regular text content - process inline markdown
      return (
        <span key={index} className="font-sans">
          {renderInlineMarkdown(part)}
        </span>
      )
    })
  }

  const renderInlineMarkdown = (text: string) => {
    // Process inline code first
    const parts = text.split(/`([^`]+)`/g)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is inline code
        return (
          <code key={index} className="px-1.5 py-0.5 bg-muted text-sm font-mono rounded border">
            {part}
          </code>
        )
      }
      
      // Process other markdown in regular text
      return (
        <span key={index}>
          {renderTextFormatting(part)}
        </span>
      )
    })
  }

  const renderTextFormatting = (text: string) => {
    // Process bold text
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Process italic text
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Process line breaks
    processed = processed.replace(/\n/g, '<br />')
    
    // Process bullet points
    processed = processed.replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-muted-foreground mt-1">•</span><span>$1</span></div>')
    
    // Process numbered lists
    processed = processed.replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-muted-foreground font-medium min-w-[1.5rem]">$1.</span><span>$2</span></div>')
    
    return <span dangerouslySetInnerHTML={{ __html: processed }} />
  }

  return (
    <div className={`markdown-content ${className}`}>
      <div className="whitespace-pre-wrap leading-relaxed">
        {renderContent(content)}
      </div>
    </div>
  )
}