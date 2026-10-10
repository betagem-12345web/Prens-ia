import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Parse markdown content into blocks
  const parseBlocks = (raw: string) => {
    const blocks: { type: 'code' | 'paragraph' | 'header' | 'list' | 'quote' | 'table'; content: string; lang?: string; level?: number; items?: string[] }[] = [];
    
    // Split code blocks first
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = raw.substring(lastIndex, match.index);
        parseNonCodeBlocks(textBefore, blocks);
      }
      blocks.push({
        type: 'code',
        lang: match[1] || 'plaintext',
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < raw.length) {
      const remainingText = raw.substring(lastIndex);
      parseNonCodeBlocks(remainingText, blocks);
    }

    return blocks;
  };

  const parseNonCodeBlocks = (text: string, blocks: any[]) => {
    const lines = text.split('\n');
    let currentList: string[] = [];
    let currentQuote: string[] = [];
    let currentTable: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: [...currentList] });
        currentList = [];
      }
    };

    const flushQuote = () => {
      if (currentQuote.length > 0) {
        blocks.push({ type: 'quote', content: currentQuote.join('\n') });
        currentQuote = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        blocks.push({ type: 'table', content: currentTable.join('\n') });
        currentTable = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        flushQuote();
        flushTable();
        continue;
      }

      // Headers
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        flushList();
        flushQuote();
        flushTable();
        blocks.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2],
        });
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>')) {
        flushList();
        flushTable();
        currentQuote.push(trimmed.replace(/^>\s?/, ''));
        continue;
      } else {
        flushQuote();
      }

      // Tables (lines starting with |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        currentTable.push(trimmed);
        continue;
      } else {
        flushTable();
      }

      // Lists (- or * or numbered 1.)
      const listMatch = trimmed.match(/^([-*]|\d+\.)\s+(.*)$/);
      if (listMatch) {
        currentList.push(listMatch[2]);
        continue;
      } else {
        flushList();
      }

      // Normal paragraph
      blocks.push({
        type: 'paragraph',
        content: line,
      });
    }

    flushList();
    flushQuote();
    flushTable();
  };

  // Render inline formatting (bold, italic, code, links)
  const renderInline = (str: string) => {
    if (!str) return null;

    // Tokenize inline markdown
    const parts: React.ReactNode[] = [];
    let remaining = str;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code `code`
      const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
      if (inlineCodeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-purple-950/50 border border-purple-500/20 text-purple-200 font-mono text-[0.875em]"
          >
            {inlineCodeMatch[1]}
          </code>
        );
        remaining = remaining.substring(inlineCodeMatch[0].length);
        continue;
      }

      // Bold **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} className="font-semibold text-slate-100">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch[0].length);
        continue;
      }

      // Italic *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic text-slate-200">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.substring(italicMatch[0].length);
        continue;
      }

      // Link [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/40 hover:decoration-purple-400 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.substring(linkMatch[0].length);
        continue;
      }

      // Ordinary characters up to the next special char
      const nextSpecial = remaining.search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Just consume the single character if regex didn't match full pattern
        parts.push(remaining[0]);
        remaining = remaining.substring(1);
      } else {
        parts.push(remaining.substring(0, nextSpecial));
        remaining = remaining.substring(nextSpecial);
      }
    }

    return parts;
  };

  const renderTable = (tableContent: string) => {
    const lines = tableContent.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return null;

    const parseRow = (line: string) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

    const header = parseRow(lines[0]);
    // Check if second line is divider (e.g. |---|---|)
    const hasDivider = lines.length > 1 && /^\|?(\s*:?-+:?\s*\|)+\s*$/.test(lines[1]);
    const bodyRows = (hasDivider ? lines.slice(2) : lines.slice(1)).map(parseRow);

    return (
      <div className="overflow-x-auto my-3 rounded-lg border border-purple-900/30 bg-[#0B0C16]">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-purple-900/40 bg-purple-950/20 text-purple-200 font-medium">
              {header.map((col, idx) => (
                <th key={idx} className="px-3.5 py-2.5">
                  {renderInline(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-purple-900/10 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-slate-300">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3 leading-relaxed text-[15px] text-slate-200 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <div
              key={index}
              className="my-3.5 rounded-xl border border-purple-800/30 bg-[#07080F] shadow-lg shadow-black/40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-950/40 to-slate-900/70 border-b border-purple-900/30 text-xs text-purple-300/80">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-purple-300">
                  {block.lang || 'código'}
                </span>
                <button
                  onClick={() => handleCopyCode(block.content, index)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-900/30 hover:bg-purple-800/40 text-purple-200 hover:text-white border border-purple-700/30 transition-all text-xs active:scale-95 cursor-pointer"
                  title="Copiar código al portapapeles"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto text-[13.5px] font-mono leading-normal text-slate-200">
                <pre className="m-0 font-mono">
                  <code>{block.content}</code>
                </pre>
              </div>
            </div>
          );
        }

        if (block.type === 'header') {
          const Tag = (
            block.level === 1
              ? 'h2'
              : block.level === 2
              ? 'h3'
              : 'h4'
          ) as 'h2' | 'h3' | 'h4';

          const classes =
            block.level === 1
              ? 'text-xl font-bold font-display text-white mt-4 mb-2 pb-1.5 border-b border-purple-900/30'
              : block.level === 2
              ? 'text-lg font-semibold font-display text-white mt-3.5 mb-1.5'
              : 'text-base font-semibold font-display text-purple-100 mt-3 mb-1';

          return (
            <Tag key={index} className={classes}>
              {renderInline(block.content)}
            </Tag>
          );
        }

        if (block.type === 'list' && block.items) {
          return (
            <ul key={index} className="space-y-1.5 my-2 pl-4 list-none">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="text-purple-400 font-bold select-none text-base leading-tight mt-0.5">·</span>
                  <div className="flex-1 text-slate-200">{renderInline(item)}</div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="my-3 pl-4 border-l-2 border-purple-500/70 italic text-purple-200/90 bg-purple-950/20 py-1.5 rounded-r-lg"
            >
              {renderInline(block.content)}
            </blockquote>
          );
        }

        if (block.type === 'table') {
          return <React.Fragment key={index}>{renderTable(block.content)}</React.Fragment>;
        }

        return (
          <p key={index} className="my-1.5 text-slate-200 leading-relaxed">
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
};
