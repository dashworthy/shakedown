#!/usr/bin/env bash
# Places a finished run's shakedown.json, plus a placeholder JPEG for every step shot it names.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p shakedown/shots
for f in F1.S1-1 F1.S1-2 F1.S1-3 F1.S1-4 F1.S1-5 F1.S2-1 F1.S2-2 F1.S2-3 F1.S2-4 F1.S2-b1 F1.S2-b2 F1.S2-b3 F1.S2-b4 F1.U1-1 F1.U1-2 F1.U1-3; do
  printf '\xff\xd8\xff\xd9' > "shakedown/shots/$f.png"
done
