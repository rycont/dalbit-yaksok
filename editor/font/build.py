"""Interlude Code Square — 모든 글리프가 정확히 1em 정사각형인 원고지용 코드 폰트.

한글은 Interlude, ASCII·기호·powerline은 JetBrains Mono Nerd Font에서 가져온 뒤
모든 글리프의 advance를 1em으로 통일한다. 그래서 <textarea> 하나에 CSS 격자 배경만
깔면 원고지가 된다 — 가짜 에디터도, DOM 직접 렌더링도 필요 없다.

    pip install fonttools brotli
    python build.py            # → InterludeCodeSquare.woff2
"""

import io
import urllib.request
import zipfile
from pathlib import Path

from fontTools import subset
from fontTools.pens.boundsPen import ControlBoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.scaleUpem import scale_upem
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).parent
CACHE = HERE / ".cache"
NAME = "Interlude Code Square"
PS_NAME = "InterludeCodeSquare-Regular"
OUT = HERE / "InterludeCodeSquare.woff2"

UPEM = 1000
SCALE = 0.7  # 칸 대비 글자 크기. 나머지가 글자와 격자선 사이 여백
INSTANCE = {"wght": 400, "opsz": 20}
BORROW = [*range(0x21, 0x7F), *range(0xE0A0, 0xE0D5)]  # ASCII + powerline
CENTER_ON = "가힣뷁명한글"  # 세로 중심을 잡는 기준 글자
KEEP = (
    "U+0020-007E,U+00A0-00FF,U+1100-11FF,U+3000-303F,"
    "U+3131-318E,U+AC00-D7A3,U+2018-201D,U+2026,U+E0A0-E0D4"
)

# ponytail: 두 소스 모두 HEAD/latest를 받는다. 빌드를 재현 가능하게 묶어야 하면 커밋·태그로 고정.
INTERLUDE = "https://raw.githubusercontent.com/avanturation/interlude/HEAD/fonts/InterludeVariable.ttf"
NERD = (
    "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"
)


def fetch(url: str, name: str, member: str | None = None) -> Path:
    """소스 폰트를 .cache/ 에 받아둔다. member를 주면 zip 안에서 꺼낸다."""
    dst = CACHE / name
    if dst.exists():
        return dst
    CACHE.mkdir(exist_ok=True)
    print(f"  받는 중 {url}")
    with urllib.request.urlopen(url) as r:
        blob = r.read()
    dst.write_bytes(zipfile.ZipFile(io.BytesIO(blob)).read(member) if member else blob)
    return dst


print("소스 폰트 준비")
base = TTFont(fetch(INTERLUDE, "interlude.ttf"))
donor = TTFont(
    fetch(NERD, "jetbrainsmono-nf.ttf", "JetBrainsMonoNerdFontMono-Regular.ttf")
)

base = instantiateVariableFont(base, INSTANCE, inplace=True, updateFontNames=False)
scale_upem(base, UPEM)  # Interlude는 2048, Nerd Font는 1000

# ── 1. Nerd Font 글리프 이식 ────────────────────────────────────────────
# 어차피 아래에서 advance를 전부 덮어쓰므로 도너는 모노스페이스일 필요가 없다.
dset, dcm = donor.getGlyphSet(), donor.getBestCmap()
glyf, hmtx = base["glyf"], base["hmtx"]
borrowed = 0
for cp in BORROW:
    if cp not in dcm:
        continue
    name = f"nf{cp:04X}"
    rec = DecomposingRecordingPen(dset)  # 컴포지트를 윤곽선으로 분해
    dset[dcm[cp]].draw(rec)
    pen = TTGlyphPen(None)
    rec.replay(pen)
    glyf[name] = pen.glyph()  # glyphOrder에도 자동 등록된다
    hmtx[name] = donor["hmtx"][dcm[cp]]
    for t in base["cmap"].tables:
        if t.isUnicode():
            t.cmap[cp] = name  # 코드포인트를 가로챈다
    borrowed += 1
base.setGlyphOrder(glyf.glyphOrder)
base["maxp"].numGlyphs = len(glyf.glyphOrder)

# ── 2. 세로 기준: 한글의 시각적 중심을 칸 중심에 맞춘다 ──────────────────
# Interlude 원본은 ascent+descent(2556) > upem(2048) 이라 line-height:1 에서
# half-leading이 음수가 되고 글자가 아래로 밀린다. 합을 upem에 딱 맞춰 없앤다.
cm, gs = base.getBestCmap(), base.getGlyphSet()


def outline(name):
    """ponytail: 컴포지트를 전부 분해 → 글리프 재사용이 사라진다. woff2가 눌러주니 무시."""
    rec = DecomposingRecordingPen(gs)
    gs[name].draw(rec)
    bounds = ControlBoundsPen(None)
    rec.replay(bounds)
    return rec, bounds.bounds


ys = [
    v
    for c in CENTER_ON
    if ord(c) in cm and (b := outline(cm[ord(c)])[1])
    for v in (b[1], b[3])
]
vc = (min(ys) + max(ys)) / 2
ASC = round(UPEM / 2 + vc)
DESC = UPEM - ASC

# ── 3. 정방형화: 칸 중앙 정렬 + SCALE 만큼 축소 ──────────────────────────
built = {}
for name in glyf.glyphOrder:
    adv, _ = hmtx[name]
    src, b = outline(name)
    if b is None:  # 공백류: 그릴 게 없다
        hmtx[name] = (UPEM, 0)
        continue
    # 결합 문자(advance 0)는 앞 글자 위에 쌓여야 하므로 가로 이동을 하지 않는다
    dx = 0 if adv == 0 else UPEM / 2 - (b[0] + b[2]) / 2
    s = SCALE
    tx = (s, 0, 0, s, dx * s + UPEM / 2 * (1 - s), vc * (1 - s))
    rec = DecomposingRecordingPen(gs)
    src.replay(TransformPen(rec, tx))
    built[name] = rec

for name, rec in built.items():
    pen = TTGlyphPen(None)
    rec.replay(pen)
    glyf[name] = g = pen.glyph()
    g.recalcBounds(glyf)
    hmtx[name] = (hmtx[name][0] and UPEM, g.xMin if g.numberOfContours else 0)

# ── 4. 격자를 깨는 테이블 제거 + 메트릭 고정 ────────────────────────────
# GSUB 삭제가 특히 중요하다. JetBrains Mono의 -> != => 리거처가 두 칸을 한 글리프로 합친다.
for tag in (
    "GSUB",
    "GPOS",
    "kern",
    "HVAR",
    "MVAR",
    "VVAR",
    "gvar",
    "fvar",
    "STAT",
    "avar",
):
    if tag in base:
        del base[tag]

hhea, os2 = base["hhea"], base["OS/2"]
hhea.ascender, hhea.descender, hhea.lineGap = ASC, -DESC, 0
hhea.advanceWidthMax = UPEM
os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = ASC, -DESC, 0
os2.usWinAscent, os2.usWinDescent = ASC, DESC
os2.fsSelection |= 1 << 7  # USE_TYPO_METRICS
os2.xAvgCharWidth = UPEM
base["post"].isFixedPitch = 1
for nid, val in ((1, NAME), (4, NAME), (6, PS_NAME), (16, NAME)):
    base["name"].setName(val, nid, 3, 1, 0x409)

full = CACHE / "full.ttf"
base.save(full)

# ── 5. 검증 후 서브셋 → woff2 ──────────────────────────────────────────
check = TTFont(full)
advances = {a for a, _ in check["hmtx"].metrics.values()}
assert advances <= {0, UPEM}, f"정방형이 아닌 글리프가 있다: {sorted(advances)[:8]}"
assert check["hhea"].ascender - check["hhea"].descender == UPEM, (
    "half-leading이 0이 아니다"
)

subset.main(
    [
        str(full),
        f"--output-file={OUT}",
        "--flavor=woff2",
        "--layout-features=",
        f"--unicodes={KEEP}",
    ]
)

print(f"\n{OUT.name}  {OUT.stat().st_size / 1024:.0f}KB")
print(f"  글리프 {len(glyf.glyphOrder)}개 (Nerd Font에서 {borrowed}개)")
print(f"  advance 1em 고정 · ascent/descent {ASC}/{DESC} · 글자 크기 {SCALE}")
