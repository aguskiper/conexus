import { createElement, Fragment, type ReactNode } from "react";
import { safeLinkHref } from "./urls";

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
type Context = "document" | "blocks" | "inline" | "list";
export function renderTipTap(value: unknown): ReactNode {
  let remaining = 10000;
  function render(value: unknown, context: Context, depth = 0, key = "root"): ReactNode {
    const node = object(value);
    if (!node || depth > 50 || --remaining < 0) return null;
    const children = (nextContext: Context) => Array.isArray(node?.content)
      ? node.content.slice(0, 10000).map((child, index) => render(child, nextContext, depth + 1, key + "." + index)) : null;
    const attrs = object(node.attrs) ?? {};
    if (node.type === "doc" && context === "document") return createElement(Fragment, { key }, children("blocks"));
    if (context === "blocks") {
      if (node.type === "paragraph") return createElement("p", { key }, children("inline"));
      if (node.type === "heading" && (attrs.level === 2 || attrs.level === 3)) return createElement(attrs.level === 2 ? "h2" : "h3", { key }, children("inline"));
      if (node.type === "bulletList") return createElement("ul", { key }, children("list"));
      if (node.type === "orderedList") return createElement("ol", { key, start: Number.isSafeInteger(attrs.start) && Number(attrs.start) > 0 && Number(attrs.start) < 10000 ? Number(attrs.start) : undefined }, children("list"));
      if (node.type === "blockquote") return createElement("blockquote", { key }, children("blocks"));
    }
    if (node.type === "listItem" && context === "list") return createElement("li", { key }, children("blocks"));
    if (context === "inline") {
      if (node.type === "hardBreak") return createElement("br", { key });
      if (node.type !== "text" || typeof node.text !== "string") return null;
      let content: ReactNode = node.text;
      const applied = new Set<string>();
      for (const rawMark of Array.isArray(node.marks) ? node.marks.slice(0, 12) : []) {
        const mark = object(rawMark);
        if (!mark || typeof mark.type !== "string" || applied.has(mark.type)) continue;
        applied.add(mark.type);
        if (mark.type === "bold") content = createElement("strong", null, content);
        if (mark.type === "italic") content = createElement("em", null, content);
        if (mark.type === "link") {
          const href = safeLinkHref(object(mark.attrs)?.href);
          if (href) {
            const external = /^https?:\/\//i.test(href);
            content = createElement("a", { href, ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) }, content);
          }
        }
      }
      return createElement(Fragment, { key }, content);
    }
    return null;
  }
  return render(value, "document");
}
