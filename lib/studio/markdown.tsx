import type { ComponentChildren } from "preact";
import { lexer, type Token, type Tokens } from "marked";

function narrativeTokens(markdown: string): Token[] {
  return lexer(markdown);
}

function MarkdownInline({ tokens }: { tokens?: Token[] }): ComponentChildren {
  if (!tokens) return null;
  return tokens.map((token, i) => {
    switch (token.type) {
      case "text":
        return token.tokens
          ? <MarkdownInline key={i} tokens={token.tokens} />
          : token.text;
      case "strong":
        return (
          <strong key={i}>
            <MarkdownInline tokens={token.tokens} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <MarkdownInline tokens={token.tokens} />
          </em>
        );
      case "codespan":
        return <code key={i}>{token.text}</code>;
      case "link":
        return (
          <a
            key={i}
            href={token.href}
            class="lg-link hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-accent)]"
            target="_blank"
            rel="noreferrer"
          >
            <MarkdownInline tokens={token.tokens} />
          </a>
        );
      case "br":
        return <br key={i} />;
      default:
        return "text" in token ? token.text : null;
    }
  });
}

export function MarkdownView({ source }: { source: string }) {
  const tokens = narrativeTokens(source);
  return (
    <div class="lesson-narrative text-sm leading-relaxed text-[var(--lg-text)]">
      {tokens.map((token, i) => {
        switch (token.type) {
          case "paragraph":
            return (
              <p key={i}>
                <MarkdownInline tokens={token.tokens} />
              </p>
            );
          case "heading":
            return (
              <h3
                key={i}
                class="font-semibold text-[var(--lg-text)] mt-2 text-pretty"
              >
                <MarkdownInline tokens={token.tokens} />
              </h3>
            );
          case "list": {
            const Tag = token.ordered ? "ol" : "ul";
            return (
              <Tag key={i} class={token.ordered ? "list-decimal" : "list-disc"}>
                {token.items.map((item: Tokens.ListItem, j: number) => (
                  <li key={j}>
                    <MarkdownInline tokens={item.tokens} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "code":
            return (
              <pre key={i} class="p-3 overflow-x-auto">
                <code>{token.text}</code>
              </pre>
            );
          case "space":
            return null;
          default:
            return "text" in token ? <p key={i}>{token.text}</p> : null;
        }
      })}
    </div>
  );
}
