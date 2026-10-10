import React from 'react';
import ReactMarkdown from 'react-markdown';

export const BlogContent = ({ content }: { content: string }) => <div data-testid="blog-content" className="blog-content">
  <ReactMarkdown skipHtml components={{
    a: ({ node, children, ...props }) => <a {...props} data-testid={`blog-link-${node?.position?.start.offset}`} rel="noreferrer">{children}</a>,
    img: () => null,
  }}>{content}</ReactMarkdown>
</div>;