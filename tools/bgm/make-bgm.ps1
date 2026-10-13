<#
.SYNOPSIS
  BGM の加工：MuseScore 書き出し WAV → ループ加工 → AAC（.m4a）。ラウドネスとピークを報告する。

.DESCRIPTION
  docs/design/sound.md「BGM の制作」の手順をそのまま実行する（Senaris の gen_bgm.ps1 相当）。
    1. 先頭の無音を検出して報告する（あれば MuseScore 側で落としてから再実行）。
    2. ループ長 L で切り、切り落とした残響の尾を先頭に足し込む（amix normalize=0）。
       同時に、入力の統合ラウドネスを測って -TargetLufs（既定 -23）へ一定ゲインで合わせる（動的圧縮はしない）。
    3. AAC 96 kbps / 44.1 kHz / ステレオで src/assets/characters/<id>/<id>-bgm.m4a に書き出す。
    4. 入力・加工後の 統合ラウドネス（LUFS）とピークを ebur128 で測って表にする。
  L は -LoopSeconds で直接渡すか、-Bars / -Tempo（/ -BeatsPerBar）から求める：L = 小節数 × 拍数 × 60 ÷ テンポ。
  前提：ffmpeg が PATH にあること。残響長 < L（残響が長い曲は MuseScore で2周に複製して [L, 2L] を切り出す）。

.EXAMPLE
  .\tools\bgm\make-bgm.ps1 -In .\work\mao-bgm.wav -Id mao -Bars 32 -Tempo 96
.EXAMPLE
  .\tools\bgm\make-bgm.ps1 -In .\work\rin-bgm.wav -Id rin -LoopSeconds 34.909
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $In,            # 書き出した WAV（44.1 kHz / 16 bit / ステレオ）
  [Parameter(Mandatory)] [string] $Id,            # キャラ id（出力先 src/assets/characters/<id>/<id>-bgm.m4a）
  [double] $LoopSeconds = 0,                      # ループ長 L（秒）。0 なら Bars/Tempo から計算
  [int]    $Bars = 0,
  [double] $Tempo = 0,
  [int]    $BeatsPerBar = 4,
  [string] $Out = '',                             # 省略時は src/assets/characters/<id>/<id>-bgm.m4a
  [string] $Bitrate = '96k',
  [double] $TargetLufs = -23                      # 統合ラウドネスの目標。0 なら音量を変えない
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'ffmpeg が見つかりません（PATH に入れてください）' }
if (-not (Test-Path $In)) { throw "入力が見つかりません: $In" }

if ($LoopSeconds -le 0) {
  if ($Bars -le 0 -or $Tempo -le 0) { throw '-LoopSeconds か、-Bars と -Tempo を指定してください' }
  $LoopSeconds = $Bars * $BeatsPerBar * 60.0 / $Tempo
}
$L = [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0:0.000}', $LoopSeconds)

$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
if ($Out -eq '') { $Out = Join-Path $repo "src\assets\characters\$Id\$Id-bgm.m4a" }
$outDir = Split-Path $Out
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }
$looped = Join-Path ([IO.Path]::GetTempPath()) "$Id-bgm-looped.wav"

# ffmpeg は解析結果を stderr に出す。PowerShell 5.1 は native の stderr を ErrorRecord に包むので文字列に戻して束ねる。
function Invoke-FfmpegLog([string[]] $ffArgs) {
  $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { (& ffmpeg @ffArgs 2>&1 | ForEach-Object { "$_" }) -join "
" } finally { $ErrorActionPreference = $prev }
}

function Measure-Loudness([string] $file) {
  $log = Invoke-FfmpegLog @('-hide_banner', '-nostats', '-i', $file, '-af', 'ebur128=peak=true', '-f', 'null', '-')
  # ebur128 は毎フレーム I: を出すので、末尾の Summary（最後の一致）を採る。
  $last = { param($re) $m = [regex]::Matches($log, $re); if ($m.Count) { $m[$m.Count - 1].Groups[1].Value } else { '?' } }
  $i  = & $last 'I:\s+(-?[\d.]+)\s+LUFS'
  $tp = & $last 'Peak:\s+(-?[\d.]+)\s+dBFS'
  $d  = if ($log -match 'Duration:\s+(\d+:\d+:[\d.]+)') { $Matches[1] } else { '?' }
  [pscustomobject]@{ File = (Split-Path $file -Leaf); Duration = $d; LUFS = $i; TruePeak_dBFS = $tp }
}

Write-Host "ループ長 L = $L 秒" -ForegroundColor Cyan

# 1. 先頭の無音（-50 dB 以下が 0.05 秒以上）を報告する。あれば MuseScore 側で詰める。
$sil = Invoke-FfmpegLog @('-hide_banner', '-nostats', '-i', $In, '-af', 'silencedetect=noise=-50dB:d=0.05', '-t', '2', '-f', 'null', '-')
if ($sil -match 'silence_start:\s+0(\.0+)?\s' -and $sil -match 'silence_end:\s+([\d.]+)') {
  Write-Warning ("先頭に無音 {0} 秒。加工前に落とすこと（sound.md）。" -f $Matches[1])
}

# 2. ループ加工：[0,L) を本体、[L,末尾) の残響を先頭へ折り返して加算（normalize=0 必須）。
#    音量は入力の統合ラウドネスから一定ゲインを求めて最後に掛ける（MuseScore の master を触らずに済む）。
$inMeasure = Measure-Loudness $In
if ($inMeasure.TruePeak_dBFS -ne '?' -and [double]::Parse($inMeasure.TruePeak_dBFS, [Globalization.CultureInfo]::InvariantCulture) -gt -0.1) {
  Write-Warning ("入力のピークが {0} dBFS。書き出しの時点でクリップしている疑い（MuseScore の master を下げて書き出し直すと確実）。" -f $inMeasure.TruePeak_dBFS)
}
$gain = '0.00'
if ($TargetLufs -ne 0 -and $inMeasure.LUFS -ne '?') {
  $gainDb = $TargetLufs - [double]::Parse($inMeasure.LUFS, [Globalization.CultureInfo]::InvariantCulture)
  $gain = [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0:0.00}', $gainDb)
  Write-Host "音量補正 $gain dB（$($inMeasure.LUFS) → $TargetLufs LUFS）" -ForegroundColor Cyan
}
$filter = "[0]atrim=0:${L},asetpts=PTS-STARTPTS[body];[1]atrim=${L},asetpts=PTS-STARTPTS,apad=whole_dur=${L}[tail];[body][tail]amix=inputs=2:normalize=0:duration=first,volume=${gain}dB[out]"
& ffmpeg -hide_banner -loglevel error -y -i $In -i $In -filter_complex $filter -map '[out]' -ar 44100 -ac 2 $looped
if ($LASTEXITCODE -ne 0) { throw 'ループ加工に失敗しました' }

# 3. AAC へ。
& ffmpeg -hide_banner -loglevel error -y -i $looped -c:a aac -b:a $Bitrate -ar 44100 -ac 2 $Out
if ($LASTEXITCODE -ne 0) { throw 'AAC 変換に失敗しました' }

# 4. 報告。加工後のピークが（音量補正ぶんを除いて）入力より上がっていたら折り返しの加算でクリップしている疑い。
@( $inMeasure, (Measure-Loudness $looped), (Measure-Loudness $Out) ) | Format-Table -AutoSize
Remove-Item $looped -ErrorAction SilentlyContinue
Write-Host ("出力: {0}  ({1:N0} bytes)" -f $Out, (Get-Item $Out).Length) -ForegroundColor Green
Write-Host '次：ブラウザで継ぎ目を実聴。Character.bgm にパスを設定し、character-<id>-sound.md を制作ノートへ。'
