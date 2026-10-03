import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePdf } from '../src/parsePdf';
import { LIMITS } from '../src/shared/documents';
class ControlledWorker {
  static instances: ControlledWorker[] = [];
  onmessage?: (e: { data: unknown }) => void; onerror?: () => void;
  terminate = vi.fn(); postMessage = vi.fn();
  constructor() { ControlledWorker.instances.push(this); }
}
afterEach(()=>{vi.unstubAllGlobals();ControlledWorker.instances=[];});
const file = () => new File(['%PDF-1.7\nsynthetic test'],'supported.pdf',{type:'application/pdf'});
describe('browser parser resource limits and termination',()=>{
  it('oversize rejected before file reading',async()=>{const large = new File([new Uint8Array(LIMITS.bytes+1)],'oversize.pdf',{type:'application/pdf'});const read=vi.spyOn(large,'arrayBuffer');await expect(parsePdf(large,new AbortController().signal)).rejects.toThrow('5 MiB');expect(read).not.toHaveBeenCalled();});
  it('non-PDF extension rejected',async()=>{await expect(parsePdf(new File(['%PDF-'],'x.txt'),new AbortController().signal)).rejects.toThrow('PDF file');});
  it('MIME rejected even if filename looks like PDF',async()=>{await expect(parsePdf(new File(['%PDF-'],'x.pdf',{type:'image/png'}),new AbortController().signal)).rejects.toThrow('PDF file');});
  it('signature rejected',async()=>{await expect(parsePdf(new File(['hello'],'x.pdf',{type:'application/pdf'}),new AbortController().signal)).rejects.toThrow('signature');});
  it('empty file rejected',async()=>{await expect(parsePdf(new File([],'x.pdf'),new AbortController().signal)).rejects.toThrow('empty');});
  it('timeout terminates actual worker',async()=>{vi.stubGlobal('Worker',ControlledWorker);await expect(parsePdf(file(),new AbortController().signal,10)).rejects.toThrow('timed out');expect(ControlledWorker.instances[0].terminate).toHaveBeenCalledOnce();});
  it('cancellation terminates actual worker',async()=>{vi.stubGlobal('Worker',ControlledWorker);const controller=new AbortController(),pending=parsePdf(file(),controller.signal);await vi.waitFor(()=>expect(ControlledWorker.instances).toHaveLength(1));controller.abort();await expect(pending).rejects.toThrow('cancelled');expect(ControlledWorker.instances[0].terminate).toHaveBeenCalledOnce();});
  it('ignores PDF.js handshake and waits for application result',async()=>{vi.stubGlobal('Worker',ControlledWorker);let settled=false;const pending=parsePdf(file(),new AbortController().signal).then(value=>{settled=true;return value;});await vi.waitFor(()=>expect(ControlledWorker.instances).toHaveLength(1));const worker=ControlledWorker.instances[0];worker.onmessage?.({data:{action:'ready'}});expect(settled).toBe(false);expect(worker.terminate).not.toHaveBeenCalled();worker.onmessage?.({data:{type:'review-result',document:{template:'client-intake-v1'}}});expect(await pending).toMatchObject({template:'client-intake-v1'});expect(worker.terminate).toHaveBeenCalledOnce();});
  it('pre-cancelled input never starts a worker',async()=>{vi.stubGlobal('Worker',ControlledWorker);const c=new AbortController();c.abort();await expect(parsePdf(file(),c.signal)).rejects.toThrow('cancelled');expect(ControlledWorker.instances).toHaveLength(0);});
});
