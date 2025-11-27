import { visit } from "unist-util-visit";
import type { Root } from "hast";

export function rehypeSingleCharLink() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a") {
        const textContent = extractTextContent(node);
        const trimmedText = textContent.trim();

        // Only style single-character links like [1], [2], [3]
        if (trimmedText.length === 1) {
          node.properties = node.properties || {};

          const existingClass = Array.isArray(node.properties.className)
            ? node.properties.className.filter(
                (c): c is string => typeof c === "string"
              )
            : typeof node.properties.className === "string"
            ? [node.properties.className]
            : [];

          // Quiet, superscript-style reference marker
          node.properties.className = [
            ...existingClass,
            "ml-1",              // small left spacing
            "align-super",       // superscript position
            "text-[10px]",       // tiny text
            "text-neutral-500",  // soft grey
            "opacity-60",        // low contrast
            "hover:opacity-100", // brighten slightly on hover
            "no-underline",      // no link underline
          ];
        }
      }
    });
  };
}

function extractTextContent(node: any): string {
  if (node.type === "text") {
    return node.value || "";
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextContent(child)).join("");
  }

  return "";
}
