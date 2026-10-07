import { renderTipTap } from "@/lib/cms/tiptap";
import styles from "./Blog.module.css";

export function TipTapContent({ content }: { content: unknown }) {
  return <div className={styles.prose}>{renderTipTap(content)}</div>;
}
