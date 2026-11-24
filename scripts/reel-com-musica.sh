#!/usr/bin/env bash
# Junta a trilha ao reel (vídeo mudo do kit): corta no tamanho do vídeo, entra suave e sai em fade.
# Uso: scripts/reel-com-musica.sh <video.mp4> <musica.mp3> <saida.mp4> [inicio_da_musica_em_segundos]
set -euo pipefail
v="$1"; a="$2"; out="$3"; start="${4:-0}"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
fo=$(python3 -c "print(max(0, $d - 1.2))")
ffmpeg -y -loglevel error -i "$v" -ss "$start" -i "$a" \
  -filter_complex "[1:a]atrim=0:$d,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st=$fo:d=1.2,volume=0.9[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$out"
echo "ok $out ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s)"
