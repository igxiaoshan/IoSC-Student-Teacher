#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频/音频转字幕脚本
用法: python transcribe.py <视频文件路径> [模型大小]
输出: WebVTT 格式字幕到 stdout，错误信息到 stderr
模型大小: tiny / base / small / medium / large-v3（默认 large-v3）
"""

import sys
import os

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


def transcribe(video_path: str, model_size: str = "large-v3") -> str:
    from faster_whisper import WhisperModel

    if not os.path.exists(video_path):
        print(f"ERROR: 文件不存在: {video_path}", file=sys.stderr)
        sys.exit(1)

    print(f"[transcribe] 模型: {model_size}, 文件: {os.path.basename(video_path)}", file=sys.stderr)

    # GPU 优先，失败自动回退 CPU
    model = None
    try:
        model = WhisperModel(model_size, device="cuda", compute_type="float16")
        print("[transcribe] 使用 GPU (float16)", file=sys.stderr)
    except Exception as e:
        print(f"[transcribe] GPU 不可用: {e}", file=sys.stderr)

    if model is None:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        print("[transcribe] 使用 CPU (int8)", file=sys.stderr)

    def _do_transcribe(m):
        return m.transcribe(
            video_path,
            language="zh",                   # 固定中文，避免自动检测误判
            initial_prompt="以下是中文普通话教学视频，可能包含英文专业术语。",
            beam_size=5,
            temperature=0,                   # 贪心解码，减少幻觉
            condition_on_previous_text=True,  # 利用上下文提升连贯性
            # Whisper 内置质量过滤（保持宽松，避免误删有效内容）
            no_speech_threshold=0.6,         # 置信度低于此值跳过（默认 0.6，无需收紧）
            log_prob_threshold=-1.0,         # 宽松：允许低概率但真实的语音
            compression_ratio_threshold=2.4, # 仅过滤高度重复的幻觉输出
            # VAD：教学视频停顿较长，用默认 500ms 避免把句子切太碎
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=500,  # 500ms 静音才切割
                speech_pad_ms=200,            # 语音前后各留 200ms 缓冲
            ),
            word_timestamps=False,           # 不需要词级时间戳，segment 级即可
        )

    # 执行转录（GPU 出错自动回退 CPU）
    try:
        segments_gen, info = _do_transcribe(model)
        segments = list(segments_gen)
    except RuntimeError as e:
        if 'cublas' in str(e).lower() or 'cuda' in str(e).lower():
            print(f"[transcribe] GPU 运行时错误，回退 CPU: {e}", file=sys.stderr)
            model = WhisperModel(model_size, device="cpu", compute_type="int8")
            segments_gen2, info = _do_transcribe(model)
            segments = list(segments_gen2)
        else:
            raise

    print(
        f"[transcribe] 语言: {info.language} (置信度 {info.language_probability:.2f}), "
        f"片段数: {len(segments)}",
        file=sys.stderr,
    )

    # 生成 WebVTT
    # 对过长的段进行切分，保证字幕可读性；不做内容过滤
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


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python transcribe.py <视频路径> [模型大小]", file=sys.stderr)
        sys.exit(1)

    video_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "large-v3"

    vtt = transcribe(video_path, model_size)
    print(vtt)
