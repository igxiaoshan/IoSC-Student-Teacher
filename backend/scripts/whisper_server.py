#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Whisper 常驻服务 - 按时间窗口切片实时识别
启动: python whisper_server.py [--port 8765] [--model large-v3]

核心原理：
  ffmpeg 按固定窗口（默认 5s）切出音频块，
  每块识别完立即推送 NDJSON，实现"播到哪秒字幕即就绪"的体验。
  使用纯标准库 HTTP 服务器，保证逐行即时 flush，无任何缓冲。
"""

import sys
import os
import json
import argparse
import subprocess
import tempfile
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# Windows: nvidia DLL 必须在 import ctranslate2 之前加入 PATH
if sys.platform == 'win32':
    import site
    for sp in site.getsitepackages():
        for lib in ('cublas', 'cudnn', 'cuda_runtime', 'nvjitlink', 'cusolver', 'cufft'):
            p = os.path.join(sp, 'nvidia', lib, 'bin')
            if os.path.isdir(p):
                os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from faster_whisper import WhisperModel

# ─── 全局状态 ─────────────────────────────────────────────────
_model      = None
_model_size = 'large-v3'
_model_lock = threading.Lock()

# ─── ffmpeg/ffprobe 路径 ──────────────────────────────────────
def _find(name: str) -> str:
    import shutil
    found = shutil.which(name)
    if found:
        return found
    for c in [
        rf'C:\AiSakura\SoftWare\ffmpeg-8.1.1-essentials_build\bin\{name}.exe',
        rf'C:\ffmpeg\bin\{name}.exe',
        rf'C:\Program Files\ffmpeg\bin\{name}.exe',
    ]:
        if os.path.isfile(c):
            return c
    return name

FFMPEG  = _find('ffmpeg')
FFPROBE = _find('ffprobe')

# ─── 工具函数 ─────────────────────────────────────────────────
def fmt_ts(s: float) -> str:
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(sec):02d}.{int((s%1)*1000):03d}'

_BREAKS = ('，','。','！','？','；','、',',','.','!','?',';')

def split_long(text, start, end, max_chars=25):
    text = text.strip()
    if not text or len(text) <= max_chars:
        return [(start, end, text)]
    parts, buf = [], ''
    for ch in text:
        buf += ch
        if ch in _BREAKS and len(buf) >= 8:
            parts.append(buf.strip()); buf = ''
    if buf.strip(): parts.append(buf.strip())
    final = []
    for p in parts:
        while len(p) > max_chars:
            final.append(p[:max_chars]); p = p[max_chars:]
        if p: final.append(p)
    if not final:
        return [(start, end, text)]
    dur, total = end - start, sum(len(p) for p in final)
    result, t = [], start
    for p in final:
        d = dur * (len(p)/total if total else 1/len(final))
        result.append((t, t+d, p)); t += d
    return result

def get_model():
    global _model
    if _model: return _model
    with _model_lock:
        if _model: return _model
        print(f'[whisper] 加载模型: {_model_size}', file=sys.stderr, flush=True)
        try:
            _model = WhisperModel(_model_size, device='cuda', compute_type='float16')
            print('[whisper] GPU (float16)', file=sys.stderr, flush=True)
        except Exception as e:
            print(f'[whisper] GPU 失败({e})，用 CPU', file=sys.stderr, flush=True)
            _model = WhisperModel(_model_size, device='cpu', compute_type='int8')
        print('[whisper] 模型就绪', file=sys.stderr, flush=True)
    return _model

def get_duration(path: str) -> float:
    try:
        r = subprocess.run(
            [FFPROBE, '-v', 'quiet', '-print_format', 'json', '-show_format', path],
            capture_output=True)
        return float(json.loads(r.stdout)['format']['duration'])
    except Exception:
        return 0.0

def extract_chunk(path: str, start: float, dur: float) -> bytes:
    r = subprocess.run(
        [FFMPEG, '-y', '-ss', str(start), '-t', str(dur), '-i', path,
         '-ar', '16000', '-ac', '1', '-f', 'wav', 'pipe:1'],
        capture_output=True)
    return r.stdout

# ─── HTTP Handler ────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # 简化日志
        print(f'[whisper-http] {fmt % args}', file=sys.stderr, flush=True)

    def do_GET(self):
        if self.path == '/health':
            body = json.dumps({'status': 'ok', 'model': _model_size,
                               'ready': _model is not None}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != '/transcribe':
            self.send_error(404); return

        length = int(self.headers.get('Content-Length', 0))
        body   = json.loads(self.rfile.read(length))
        video_path  = body.get('video_path', '')
        chunk_secs  = float(body.get('chunk_secs', 5.0))

        if not video_path or not os.path.exists(video_path):
            err = json.dumps({'error': f'文件不存在: {video_path}'}).encode()
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(err))
            self.end_headers()
            self.wfile.write(err); return

        # ── 流式响应，Transfer-Encoding: chunked，每行立即 flush
        self.send_response(200)
        self.send_header('Content-Type', 'application/x-ndjson; charset=utf-8')
        self.send_header('Transfer-Encoding', 'chunked')
        self.send_header('X-Accel-Buffering', 'no')
        self.end_headers()

        def write_line(obj: dict):
            """将 JSON 行以 HTTP chunked 格式写出并立即 flush"""
            line = (json.dumps(obj, ensure_ascii=False) + '\n').encode('utf-8')
            # chunked: <hex-len>\r\n<data>\r\n
            self.wfile.write(f'{len(line):X}\r\n'.encode())
            self.wfile.write(line)
            self.wfile.write(b'\r\n')
            self.wfile.flush()

        try:
            model     = get_model()
            total_dur = get_duration(video_path)
            if total_dur <= 0:
                write_line({'error': '无法读取视频时长，请确认 ffmpeg 已安装'})
                self._end_chunked(); return

            cue_index = 0
            offset    = 0.0
            print(f'[whisper] 开始切片转录: {os.path.basename(video_path)}, '
                  f'时长={total_dur:.1f}s, chunk={chunk_secs}s',
                  file=sys.stderr, flush=True)

            while offset < total_dur:
                wav = extract_chunk(video_path, offset, chunk_secs)
                if not wav or len(wav) < 1000:
                    offset += chunk_secs; continue

                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    tmp.write(wav); tmp_path = tmp.name

                try:
                    segs, _ = model.transcribe(
                        tmp_path,
                        language='zh',
                        beam_size=5,
                        temperature=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
                        condition_on_previous_text=False,
                        no_speech_threshold=0.6,
                        log_prob_threshold=-1.0,
                        compression_ratio_threshold=2.4,
                        vad_filter=True,
                        vad_parameters=dict(min_silence_duration_ms=300, speech_pad_ms=100),
                        word_timestamps=False,
                    )
                    for seg in segs:
                        text = seg.text.strip()
                        if not text: continue
                        abs_s = offset + seg.start
                        abs_e = min(offset + seg.end, offset + chunk_secs)
                        for (ts, te, tt) in split_long(text, abs_s, abs_e):
                            if not tt: continue
                            cue_index += 1
                            write_line({
                                'index':    cue_index,
                                'start':    round(ts, 3),
                                'end':      round(te, 3),
                                'startFmt': fmt_ts(ts),
                                'endFmt':   fmt_ts(te),
                                'text':     tt,
                            })
                except Exception as e:
                    print(f'[whisper] chunk@{offset:.0f}s 错误: {e}',
                          file=sys.stderr, flush=True)
                finally:
                    os.unlink(tmp_path)

                offset += chunk_secs
                # 进度事件（前端可选用）
                write_line({'progress': round(min(offset/total_dur, 1.0), 3)})

            write_line({'done': True, 'total': cue_index})
            print(f'[whisper] 完成，共 {cue_index} 条', file=sys.stderr, flush=True)

        except Exception as e:
            print(f'[whisper] 致命错误: {e}', file=sys.stderr, flush=True)
            try: write_line({'error': str(e)})
            except Exception: pass

        self._end_chunked()

    def _end_chunked(self):
        """结束 chunked 传输"""
        try:
            self.wfile.write(b'0\r\n\r\n')
            self.wfile.flush()
        except Exception:
            pass


# ─── 主程序 ───────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port',  type=int, default=8765)
    parser.add_argument('--model', type=str, default='large-v3')
    parser.add_argument('--chunk', type=float, default=5.0,
                        help='每个音频切片秒数（默认 5s）')
    args = parser.parse_args()

    _model_size = args.model

    print(f'[whisper] 启动，端口={args.port}, 模型={args.model}, chunk={args.chunk}s',
          file=sys.stderr, flush=True)
    get_model()  # 预加载

    server = HTTPServer(('127.0.0.1', args.port), Handler)
    print(f'[whisper] 监听 http://127.0.0.1:{args.port}', file=sys.stderr, flush=True)
    server.serve_forever()
