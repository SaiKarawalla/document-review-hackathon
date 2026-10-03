import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;
export function PdfPage({ url, page }: { url: string; page: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false; let render: ReturnType<Awaited<ReturnType<typeof getDocument>['promise']>['getPage']> | undefined;
    let rendering: { cancel: () => void } | undefined;
    setError(''); setLoading(true);
    const task = getDocument({ url, useSystemFonts: true });
    const timer = setTimeout(() => { cancelled = true; rendering?.cancel(); void task.destroy(); setError('Page rendering timed out. Source excerpts remain available.'); setLoading(false); }, 15000);
    void (async () => {
      try {
        const doc = await task.promise;
        render = doc.getPage(page); const p = await render;
        if (cancelled || !ref.current) return;
        const original = p.getViewport({ scale: 1 });
        const viewport = p.getViewport({ scale: Math.min(900 / original.width, 1200 / original.height, 2) });
        const canvas = ref.current; canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
        const job = p.render({ canvas, canvasContext: ctx, viewport }); rendering = job;
        await job.promise;
        if (!cancelled) setLoading(false);
      } catch { if (!cancelled) { setError('Could not render this page. Use the extracted source excerpt.'); setLoading(false); } }
      finally { clearTimeout(timer); }
    })();
    return () => { cancelled = true; clearTimeout(timer); rendering?.cancel(); void task.destroy(); };
  }, [url, page]);
  return <div className="pdf-page">{loading && <p role="status">Rendering page {page}…</p>}{error && <p role="alert">{error}</p>}<canvas ref={ref} aria-label={`Original PDF page ${page}`} /></div>;
}
