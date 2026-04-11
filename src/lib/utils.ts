import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\p{L}\p{N}-]+/gu, "") // Remove all non-letter, non-number characters (Unicode aware)
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, "") // Trim - end
}

export function calculateReadingTime(text: string) {
  if (!text) return "0 min read";
  
  // Remove HTML tags if any
  const cleanText = text.replace(/<[^>]*>?/gm, '');
  
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  
  // Count words (considering Bengali and other Unicode characters)
  const noOfWords = cleanText.trim().split(/\s+/).length;
  
  const minutes = noOfWords / wordsPerMinute;
  const readTime = Math.ceil(minutes);
  
  return `${readTime} min read`;
}

export function getBadgeByPoints(points: number = 0): { name: string, color: string } {
  if (points >= 50000) return { name: 'Immortal', color: 'bg-purple-600' };
  if (points >= 25000) return { name: 'Mythic', color: 'bg-red-600' };
  if (points >= 10000) return { name: 'Legend', color: 'bg-orange-600' };
  if (points >= 5000) return { name: 'Master', color: 'bg-yellow-600' };
  if (points >= 2500) return { name: 'Expert', color: 'bg-blue-600' };
  if (points >= 1000) return { name: 'Rising Star', color: 'bg-green-600' };
  if (points >= 500) return { name: 'Active Member', color: 'bg-indigo-600' };
  if (points >= 250) return { name: 'Contributor', color: 'bg-cyan-600' };
  if (points >= 100) return { name: 'Explorer', color: 'bg-teal-600' };
  return { name: 'Newbie', color: 'bg-slate-500' };
}

export const joditConfig: any = {
  readonly: false,
  height: 400,
  minHeight: 300,
  maxHeight: 800,
  enableDragAndDropFileToEditor: true,
  uploader: {
    insertImageAsBase64URI: true
  },
  placeholder: 'গল্প বা লেখা শুরু করুন...',
  beautyHTML: true,
  toolbarAdaptive: true,
  spellcheck: true,
  showCharsCounter: true,
  showWordsCounter: true,
  showXPathInStatusbar: false,
  askBeforePasteFromWord: false,
  askBeforePasteHTML: false,
  defaultActionOnPaste: 'insert_clear_html',
  tabIndex: 0,
  direction: 'ltr',
  language: 'en',
  debugLanguage: false,
  tabSpan: 4,
  activeButtonsInReadOnly: ['source', 'fullsize', 'print', 'about'],
  useSplitMode: true,
  colorPickerDefaultTab: 'color',
  imageDefaultWidth: 600,
  removeButtons: [],
  disablePlugins: [],
  extraPlugins: [],
  style: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '1.6',
    padding: '20px'
  },
  buttons: [
    'source', '|',
    'bold', 'strikethrough', 'underline', 'italic', '|',
    'superscript', 'subscript', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'font', 'fontsize', 'brush', 'paragraph', '|',
    'image', 'video', 'file', 'table', 'link', '|',
    'align', 'undo', 'redo', '|',
    'hr', 'eraser', 'copyformat', '|',
    'symbol', 'fullsize', 'print', 'selectall', 'cut', 'copy', 'paste', 'about'
  ],
  buttonsMD: [
    'source', '|',
    'bold', 'italic', 'underline', '|',
    'ul', 'ol', '|',
    'font', 'fontsize', 'brush', 'paragraph', '|',
    'image', 'table', 'link', '|',
    'align', 'undo', 'redo', '|',
    'fullsize'
  ],
  buttonsSM: [
    'bold', 'italic', '|',
    'ul', 'ol', '|',
    'fontsize', 'brush', '|',
    'image', 'table', 'link', '|',
    'align', '|',
    'undo', 'redo', '|',
    'fullsize'
  ],
  buttonsXS: [
    'bold', 'italic', '|',
    'ul', 'ol', '|',
    'image', 'link', '|',
    'align', '|',
    'fullsize'
  ],
};
