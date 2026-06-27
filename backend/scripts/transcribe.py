#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频/音频转字幕脚本
用法:
  python transcribe.py <视频文件路径> [模型大小]          → WebVTT 输出到 stdout
  python transcribe.py --stream <视频文件路径> [模型大小] → 每条字幕逐行 JSON 输出到 stdout

模型大小: tiny / base / small / medium / large-v3（默认 large-v3）
"""

import sys
import os
import json

# Windows: 把 nvidia pip 包 DLL 目录加入 PATH（必须在 import ctranslate2 之前）
if sys.platform == 'win32':
    import site
    dll_dirs = []
    for sp in site.getsitepackages():
        for lib in ('cublas', 'cudnn', 'cuda_runtime', 'nvjitlink', 'cusolver', 'cufft'):
            p = os.path.join(sp, 'nvidia', lib, 'bin')
            if os.path.isdir(p):
                dll_dirs.append(p)
    if dll_dirs:
        os.environ['PATH'] = os.pathsep.join(dll_dirs) + os.pathsep + os.environ.get('PATH', '')

# 强制 stdout/stderr UTF-8，避免 Windows GBK 乱码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


def format_timestamp(seconds: float) -> str:
    """秒数 → WebVTT 时间戳 HH:MM:SS.mmm"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


# 中文标点断句符
_ZH_BREAKS = ('，', '。', '！', '？', '；', '、', ',', '.', '!', '?', ';')

def split_long_segment(text: str, start: float, end: float, max_chars: int = 25):
    """
    将过长的 segment 按标点或字符数切分为多个子片段，时间等比分配。
    max_chars: 每条字幕最大字符数（中文约 25 字可在 2 行内显示）
    """
    text = text.strip()
    if not text or len(text) <= max_chars:
        return [(start, end, text)]

    # 尝试在标点处切分
    parts = []
    buf = ''
    for ch in text:
        buf += ch
        if ch in _ZH_BREAKS and len(buf) >= 8:
            parts.append(buf.strip())
            buf = ''
    if buf.strip():
        parts.append(buf.strip())

    # 若标点切分后仍有超长块，按字符数强切
    final_parts = []
    for p in parts:
        while len(p) > max_chars:
            final_parts.append(p[:max_chars])
            p = p[max_chars:]
        if p:
            final_parts.append(p)

    if not final_parts:
        return [(start, end, text)]

    # 时间等比分配
    duration = end - start
    char_total = sum(len(p) for p in final_parts)
    result = []
    t = start
    for p in final_parts:
        ratio = len(p) / char_total if char_total > 0 else 1 / len(final_parts)
        seg_dur = duration * ratio
        result.append((t, t + seg_dur, p))
        t += seg_dur
    return result


def _load_model(model_size: str):
    """GPU 优先，失败自动回退 CPU"""
    from faster_whisper import WhisperModel
    model = None
    try:
        model = WhisperModel(model_size, device="cuda", compute_type="float16")
        print("[transcribe] 使用 GPU (float16)", file=sys.stderr)
    except Exception as e:
        print(f"[transcribe] GPU 不可用: {e}", file=sys.stderr)

    if model is None:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        print("[transcribe] 使用 CPU (int8)", file=sys.stderr)
    return model


def _do_transcribe(model, video_path: str):
    """执行转录，GPU 运行时错误自动回退 CPU"""
    from faster_whisper import WhisperModel

    def _run(m):
        return m.transcribe(
            video_path,
            language="zh",                    # 固定中文，避免自动检测误判
            # initial_prompt 故意留空：填写任何中文 prompt 都会诱导模型
            # 续写训练数据中的惯用句式（如"请不吝点赞订阅转发"），导致幻觉
            beam_size=5,
            # 温度回退列表：先用 0（贪心），若质量检查失败自动升温重试
            # 比单一 temperature=0 更抗幻觉
            temperature=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
            # 关键：设为 False，防止幻觉 segment 污染后续所有 segment
            condition_on_previous_text=False,
            no_speech_threshold=0.6,          # 无人声置信度阈值
            log_prob_threshold=-1.0,          # 宽松，不误杀真实低概率语音
            compression_ratio_threshold=2.4,  # 过滤高重复幻觉（如"哈哈哈哈哈哈"）
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=500,  # 500ms 静音才切割
                speech_pad_ms=200,            # 语音前后各留 200ms 缓冲
            ),
            word_timestamps=False,
        )

    try:
        return _run(model)
    except RuntimeError as e:
        if 'cublas' in str(e).lower() or 'cuda' in str(e).lower():
            print(f"[transcribe] GPU 运行时错误，回退 CPU: {e}", file=sys.stderr)
            fallback = WhisperModel(model.model_size_or_path if hasattr(model, 'model_size_or_path') else 'large-v3',
                                    device="cpu", compute_type="int8")
            return _run(fallback)
        raise


# ─── 流式模式 ────────────────────────────────────────────────────────────────
def transcribe_stream(video_path: str, model_size: str = "large-v3"):
    """
    流式模式：每识别到一个 segment 立即输出 JSON 行到 stdout。
    格式：
      {"index": 1, "start": 0.0, "end": 2.5, "startFmt": "00:00:00.000", "endFmt": "00:00:02.500", "text": "..."}
      ...
      {"done": true, "total": 42}   ← 最后一行
    """
    if not os.path.exists(video_path):
        print(json.dumps({"error": f"文件不存在: {video_path}"}), flush=True)
        sys.exit(1)

    print(f"[transcribe] 流式模式, 模型: {model_size}, 文件: {os.path.basename(video_path)}", file=sys.stderr)

    model = _load_model(model_size)
    segments_gen, info = _do_transcribe(model, video_path)

    print(
        f"[transcribe] 语言: {info.language} (置信度 {info.language_probability:.2f})",
        file=sys.stderr,
    )

    cue_index = 0
    for seg in segments_gen:
        text = seg.text.strip()
        if not text:
            continue
        sub_cues = split_long_segment(text, seg.start, seg.end, max_chars=25)
        for (t_start, t_end, t_text) in sub_cues:
            if not t_text:
                continue
            cue_index += 1
            payload = {
                "index":    cue_index,
                "start":    round(t_start, 3),
                "end":      round(t_end, 3),
                "startFmt": format_timestamp(t_start),
                "endFmt":   format_timestamp(t_end),
                "text":     t_text,
            }
            print(json.dumps(payload, ensure_ascii=False), flush=True)

    # 结束信号
    print(json.dumps({"done": True, "total": cue_index}), flush=True)
    print(f"[transcribe] 流式输出完成，共 {cue_index} 条", file=sys.stderr)


# ─── 批量模式（兼容旧接口）──────────────────────────────────────────────────
def transcribe(video_path: str, model_size: str = "large-v3") -> str:
    """批量模式：等待所有 segment 完成后，输出 WebVTT 字符串"""
    if not os.path.exists(video_path):
        print(f"ERROR: 文件不存在: {video_path}", file=sys.stderr)
        sys.exit(1)

    print(f"[transcribe] 批量模式, 模型: {model_size}, 文件: {os.path.basename(video_path)}", file=sys.stderr)

    model = _load_model(model_size)
    segments_gen, info = _do_transcribe(model, video_path)
    segments = list(segments_gen)

    print(
        f"[transcribe] 语言: {info.language} (置信度 {info.language_probability:.2f}), "
        f"片段数: {len(segments)}",
        file=sys.stderr,
    )

    lines = ["WEBVTT", ""]
    cue_index = 1

    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue

        sub_cues = split_long_segment(text, seg.start, seg.end, max_chars=25)
        for (t_start, t_end, t_text) in sub_cues:
            if not t_text:
                continue
            lines.append(str(cue_index))
            lines.append(f"{format_timestamp(t_start)} --> {format_timestamp(t_end)}")
            lines.append(t_text)
            lines.append("")
            cue_index += 1

    print(f"[transcribe] 输出字幕条数: {cue_index - 1}", file=sys.stderr)
    return "\n".join(lines)


# ─── 入口 ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    args = sys.argv[1:]

    # 判断是否流式模式
    stream_mode = False
    if args and args[0] in ('--stream', '-s'):
        stream_mode = True
        args = args[1:]

    if not args:
        print("用法:", file=sys.stderr)
        print("  python transcribe.py <视频路径> [模型大小]", file=sys.stderr)
        print("  python transcribe.py --stream <视频路径> [模型大小]", file=sys.stderr)
        sys.exit(1)

    video_path = args[0]
    model_size = args[1] if len(args) > 1 else "large-v3"

    if stream_mode:
        transcribe_stream(video_path, model_size)
    else:
        vtt = transcribe(video_path, model_size)
        print(vtt)
