"""Rin BGM draft (tatakidai) -> MIDI. `python -I rin-bgm-draft.py <outdir>` writes rin-bgm-draft.mid.

D minor, 4/4, q=132. Intro 4 (played once) -> A 8 -> B 8 -> chorus 8 x2 (loop = A..chorus, 32 bars).
Rin = elegant little devil: violin lead, offbeat chords on celesta (the bell = rin), pairs of the same
note as the motif (rin-rin / the pairs of chiitoitsu). The chorus ends with pairs stepping down, not a
run (the run up is mao's ittsuu hook). Density grows by section (intro/A thin -> chorus full).
"""
import struct, sys

TPQ = 480
S16 = TPQ // 4
E8 = TPQ // 2
GRACE = TPQ // 8
BAR = 16 * S16
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pitch(s):
    n = NOTE[s[0]]
    i = 1
    while i < len(s) and s[i] in '#b':
        n += 1 if s[i] == '#' else -1
        i += 1
    return n + (int(s[i:]) + 1) * 12


def melody(text, vel=92):
    """tokens: P:dur16 / r:dur16 / ^P = grace before next note"""
    ev, t, grace = [], 0, None
    for tok in text.split():
        if tok.startswith('^'):
            grace = pitch(tok[1:])
            continue
        name, d = tok.split(':')
        d = int(d) * S16
        if name != 'r':
            if grace is not None:
                ev.append((t, GRACE, grace, vel - 15))
                ev.append((t + GRACE, d - GRACE, pitch(name), vel))
            else:
                ev.append((t, d, pitch(name), vel))
        grace = None
        t += d
    return ev, t


CHORD = {
    'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'C': ['C', 'E', 'G'], 'Am': ['A', 'C', 'E'],
    'A': ['A', 'C#', 'E'], 'A7': ['A', 'C#', 'E', 'G'], 'Gm': ['G', 'Bb', 'D'], 'F': ['F', 'A', 'C'],
}


def tones(ch, lo):
    out = []
    for o in range(0, 9):
        for n in CHORD[ch]:
            p = pitch(n + str(o))
            if p >= lo:
                out.append(p)
    return sorted(out)


def root(ch):
    r = pitch(CHORD[ch][0] + '2')
    return r + 12 if r < pitch('D2') else r


CHORUS_MEL = (
    "A5:2 A5:2 D6:3 F6:3 E6:2 D6:2 A5:2 "
    "F6:2 F6:2 D6:4 C6:2 C6:2 D6:4 "
    "E6:2 E6:2 G6:3 E6:3 D6:2 C6:4 "
    "C6:8 r:2 A5:2 A5:2 C6:2 "
    "F6:2 F6:2 D6:2 F6:2 G6:2 G6:2 A6:4 "
    "G6:2 G6:2 E6:4 C6:2 C6:2 E6:4 "
    "^B5 C#6:4 E6:4 A6:2 A6:2 G6:4 "
    "A6:2 A6:2 G6:2 G6:2 E6:2 E6:2 C#6:4"
)

SONG = [
    # (section, chords, melody)
    ('intro', ['Dm', 'Bb', 'Gm', 'A7'],
     "r:16 r:16 r:16 r:8 A5:2 A5:2 C#6:2 E6:2"),
    ('A', ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A7'],
     "D6:2 D6:2 r:2 A5:2 C6:4 A5:4 "
     "G5:6 A5:2 C6:4 r:4 "
     "D6:2 D6:2 r:2 F6:2 D6:4 C6:4 "
     "C#6:6 E6:2 A5:4 r:4 "
     "F6:2 F6:2 r:2 E6:2 D6:4 A5:4 "
     "G5:2 A5:2 C6:4 E6:4 D6:4 "
     "D6:6 C6:2 Bb5:4 A5:4 "
     "A5:8 r:4 A5:2 A5:2"),
    ('B', ['Bb', 'C', 'F', 'Dm', 'Bb', 'C', 'Gm', 'A7'],
     "F5:2 F5:2 Bb5:2 Bb5:2 D6:4 C6:4 "
     "G5:2 G5:2 C6:2 C6:2 E6:4 D6:4 "
     "A5:2 A5:2 C6:2 C6:2 F6:4 E6:4 "
     "D6:8 r:4 A5:2 D6:2 "
     "F6:4 D6:2 F6:2 G6:4 F6:4 "
     "E6:4 C6:2 E6:2 G6:4 E6:4 "
     "D6:2 D6:2 G6:2 G6:2 Bb6:4 A6:4 "
     "A6:6 G6:2 E6:4 C#6:4"),
    ('C', ['Dm', 'Bb', 'C', 'Am', 'Bb', 'C', 'A', 'A7'] * 2, CHORUS_MEL + ' ' + CHORUS_MEL),
]


def accomp_bar(t0, ch, sec, i, o):
    r = root(ch)
    # bass: intro from bar 3 (half notes) / A half notes / B, chorus quarters with the octave on 3
    if sec == 'A' or (sec == 'intro' and i >= 2):
        for b in (0, 2):
            o['bass'].append((t0 + b * TPQ, 2 * TPQ - 60, r, 80))
    elif sec in ('B', 'C'):
        for b in range(4):
            o['bass'].append((t0 + b * TPQ, TPQ - 60, r + (12 if b == 2 else 0), 96 if b % 2 == 0 else 84))
    # celesta on the offbeats: A is lighter (two tones, softer)
    n, v = (2, 58) if sec == 'A' else (3, 64 if sec == 'intro' else 74)
    for b in range(4):
        for p in tones(ch, pitch('F5'))[:n]:
            o['celesta'].append((t0 + b * TPQ + E8, E8, p, v))
    if sec != 'A':
        for p in tones(ch, pitch('F3'))[:3]:
            o['strings'].append((t0, BAR - 10, p, 48 if sec == 'intro' else 56))
    d = o['drums']
    if sec == 'intro':
        if i == 3:
            for k in range(4):
                d.append((t0 + 3 * TPQ + k * S16, S16, 38, 56 + k * 8))
        return
    if sec == 'A':  # half-time: kick 1 & 3, side stick 2 & 4, soft closed hat on the offbeats
        for b in range(4):
            d.append((t0 + b * TPQ + E8, 60, 42, 52))
        for b in (0, 2):
            d.append((t0 + b * TPQ, 60, 36, 86))
        for b in (1, 3):
            d.append((t0 + b * TPQ, 60, 37, 66))
        if i == 0:
            d.append((t0, 200, 49, 72))
        return
    # B and chorus: four on the floor, snare 2 & 4, hat on the offbeat (closed in B's first half, open after)
    hat = 42 if (sec == 'B' and i < 4) else 46
    for b in range(4):
        d.append((t0 + b * TPQ, 60, 36, 96))
        d.append((t0 + b * TPQ + E8, 120, hat, 70))
    for b in (1, 3):
        d.append((t0 + b * TPQ, 60, 38, 88))
    if i % 8 == 0:
        d.append((t0, 200, 49, 84 if sec == 'C' else 74))
    if i % 8 == 7:
        for k in range(4):
            d.append((t0 + 3 * TPQ + k * S16, S16, 38, 70 + k * 8))


def vlq(n):
    b = [n & 0x7F]
    n >>= 7
    while n:
        b.insert(0, (n & 0x7F) | 0x80)
        n >>= 7
    return bytes(b)


def track(events, ch, program, name, tempo=None):
    msgs = []
    if tempo:
        msgs.append((0, 0, b'\xff\x51\x03' + int(60_000_000 / tempo).to_bytes(3, 'big')))
        msgs.append((0, 0, b'\xff\x58\x04\x04\x02\x18\x08'))
    nm = name.encode()
    msgs.append((0, 0, b'\xff\x03' + vlq(len(nm)) + nm))
    if program is not None:
        msgs.append((0, 0, bytes([0xC0 | ch, program])))
    for t, d, p, v in events:
        msgs.append((t, 2, bytes([0x90 | ch, p, v])))
        msgs.append((t + d, 1, bytes([0x80 | ch, p, 0])))
    msgs.sort(key=lambda m: (m[0], m[1]))
    data, last = b'', 0
    for t, _, m in msgs:
        data += vlq(t - last) + m
        last = t
    data += b'\x00\xff\x2f\x00'
    return b'MTrk' + struct.pack('>I', len(data)) + data


def build_song(tempo, out):
    o = {k: [] for k in ('lead', 'harm', 'dbl', 'bass', 'celesta', 'strings', 'drums')}
    t = 0
    for sec, chords, mel in SONG:
        ev, length = melody(mel, 84 if sec == 'A' else 92)
        assert length == len(chords) * BAR, (sec, length / BAR)
        o['lead'] += [(t + a, d, p, v) for a, d, p, v in ev]
        if sec == 'C':
            # chorus harmony: a 2nd violin a chord tone below the melody (about a 3rd / 4th), from the 1st pass
            for a, d, p, v in ev:
                if d <= GRACE:
                    continue
                ch = chords[a // BAR]
                below = [q for q in tones(ch, p - 9) if q <= p - 3]
                if below:
                    o['harm'].append((t + a, d, below[-1], v - 14))
            # 2nd chorus: flute an octave up
            half = len(chords) // 2 * BAR
            o['dbl'] += [(t + a, d, p + 12, v - 26) for a, d, p, v in ev if a >= half]
        for i, ch in enumerate(chords):
            accomp_bar(t + i * BAR, ch, sec, i, o)
        t += length
    trks = [
        track([], 0, None, 'Conductor', tempo),
        track(o['lead'], 0, 40, 'Violin'),
        track(o['harm'], 3, 40, 'Violin 2'),
        track(o['dbl'], 1, 73, 'Flute'),
        track(o['celesta'], 2, 8, 'Celesta'),
        track(o['strings'], 4, 48, 'Strings'),
        track(o['bass'], 5, 33, 'Bass'),
        track(o['drums'], 9, None, 'Drums'),
    ]
    with open(out, 'wb') as f:
        f.write(b'MThd' + struct.pack('>IHHH', 6, 1, len(trks), TPQ) + b''.join(trks))
    return t // BAR


if __name__ == '__main__':
    bars = build_song(132, f'{sys.argv[1]}/rin-bgm-draft.mid')
    print('bars', bars, 'intro', 4 * 4 * 60 / 132, 'L', (bars - 4) * 4 * 60 / 132)
