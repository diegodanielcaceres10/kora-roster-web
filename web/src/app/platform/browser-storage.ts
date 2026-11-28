// The storage of the page, or nothing while prerendering or when the browser blocks it.
export function browserStorage(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}
