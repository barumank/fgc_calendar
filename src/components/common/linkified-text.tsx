import React from 'react';

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

export function LinkifiedText({ text, className = '' }: { text?: string; className?: string }) {
  const parts = (text ?? '').split(URL_RE);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={/^https?:\/\//i.test(part) ? part : `https://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#EF4444] hover:underline"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
}
