"""Mao BGM draft (tatakidai) -> MIDI. `python -I mao-bgm-draft.py <outdir> song` writes mao-bgm-draft.mid; without `song` it writes the chorus sketches A/B."""
import struct, sys

TPQ = 480
S16 = TPQ // 4
GRACE = TPQ // 8
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pitch(s):
    n = NOTE[s[0]]
    i = 1
    while i < len(s) and s[i] in '#b':
        n += 1 if s[i] == '#' else -1
        i += 1
    return n + (int(s[i:]) + 1) * 12


def melody(text, vel=96):
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
    'F': ['F', 'A', 'C'], 'Bb': ['Bb', 'D', 'F'], 'C': ['C', 'E', 'G'], 'C7': ['C', 'E', 'G', 'Bb'],
    'Am': ['A', 'C', 'E'], 'Dm': ['D', 'F', 'A'], 'Gm': ['G', 'Bb', 'D'], 'A': ['A', 'C#', 'E'],
}


def tones(ch, lo):
    """chord tones ascending from midi >= lo"""
    out = []
    for oct_ in range(0, 9):
        for n in CHORD[ch]:
            p = pitch(n + str(oct_))
            if p >= lo:
                out.append(p)
    return sorted(out)


BAR = 16 * S16


def accomp(chords):
    bass, piano, dulc, strings, drums = [], [], [], [], []
    for b, ch in enumerate(chords):
        t0 = b * BAR
        root = tones(ch, pitch('D2'))[0] if CHORD[ch][0] else 0
        root = pitch(CHORD[ch][0] + '2')
        if root < pitch('D2'):
            root += 12
        e8 = TPQ // 2
        for i in range(8):
            acc = i in (0, 3, 6)
            bass.append((t0 + i * e8, e8 - 20, root + (12 if i % 2 else 0), 100 if acc else 78))
        # piano stabs 3+3+2
        voic = tones(ch, pitch('E4'))[:4]
        for st, ln in ((0, 3), (3, 3), (6, 2)):
            for p in voic:
                piano.append((t0 + st * e8, ln * e8 - 30, p, 84))
        # dulcimer 16th arpeggio (up-down)
        arp = tones(ch, pitch('A3'))[:5]
        seq = arp + arp[-2:0:-1]
        for i in range(16):
            dulc.append((t0 + i * S16, S16, seq[i % len(seq)], 62 if i % 4 else 76))
        # strings pad
        for p in tones(ch, pitch('F3'))[:3]:
            strings.append((t0, BAR - 10, p, 60))
        # drums
        for i in range(8):
            drums.append((t0 + i * e8, 60, 42, 70 if i % 2 == 0 else 50))
        for i in (0, 3):
            drums.append((t0 + i * e8, 60, 36, 100))
        for i in (2, 6):
            drums.append((t0 + i * e8, 60, 38, 92))
        if b % 8 == 0:
            drums.append((t0, 200, 49, 90))
        if b % 8 == 7:  # fill
            for i in range(4):
                drums.append((t0 + 3 * TPQ + i * S16, S16, 38, 70 + i * 8))
    return bass, piano, dulc, strings, drums


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
        us = int(60_000_000 / tempo)
        msgs.append((0, 0, b'\xff\x51\x03' + us.to_bytes(3, 'big')))
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


SKETCH = {
    # A: F major, IV-V-iii-vi / ii-V-I, run F..G (9 notes) over C7
    'A': dict(
        chords=['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'C7'],
        mel="^C6 D6:6 C6:6 A5:2 C6:2 "
            "G5:6 A5:6 C6:2 D6:2 "
            "^D6 E6:6 D6:6 C6:2 A5:2 "
            "D6:10 r:2 A5:2 C6:2 "
            "D6:6 ^E6 F6:6 G6:2 F6:2 "
            "E6:6 C6:6 G5:4 "
            "A5:6 C6:6 F6:4 "
            "r:2 F5:1 G5:1 A5:1 Bb5:1 C6:1 D6:1 E6:1 F6:1 G6:6",
    ),
    # B: D minor, i-VI-VII-v / VI-VII-V, harmonic-minor run G..A (9 notes) over A
    'B': dict(
        chords=['Dm', 'Bb', 'C', 'Am', 'Bb', 'C', 'A', 'A'],
        mel="A5:3 D6:3 F6:2 E6:2 D6:2 C6:2 A5:2 "
            "^E6 F6:6 D6:6 C6:2 D6:2 "
            "E6:6 G6:6 E6:2 D6:2 "
            "C6:12 r:2 D6:1 E6:1 "
            "F6:3 F6:3 D6:2 F6:2 G6:2 A6:4 "
            "G6:6 E6:6 C6:4 "
            "^B5 C#6:6 E6:6 A6:4 "
            "r:1 G5:1 A5:1 Bb5:1 C#6:1 D6:1 E6:1 F6:1 G6:1 A6:7",
    ),
}


def build(key, tempo, out):
    sk = SKETCH[key]
    mel, length = melody(sk['mel'])
    assert length == 8 * BAR, (key, length / BAR)
    passes = 2
    chords = sk['chords'] * passes
    lead = [(t + k * 8 * BAR, d, p, v) for k in range(passes) for t, d, p, v in mel]
    # 2nd pass: violin doubles lead an octave lower
    dbl = [(t + 8 * BAR, d, p - 12, v - 20) for t, d, p, v in mel]
    bass, piano, dulc, strings, drums = accomp(chords)
    trks = [
        track([], 0, None, 'Conductor', tempo),
        track(lead, 0, 73, 'Flute'),
        track(dbl, 1, 40, 'Violin'),
        track(piano, 2, 0, 'Piano'),
        track(dulc, 3, 15, 'Dulcimer'),
        track(strings, 4, 48, 'Strings'),
        track(bass, 5, 33, 'Bass'),
        track(drums, 9, None, 'Drums'),
    ]
    hdr = b'MThd' + struct.pack('>IHHH', 6, 1, len(trks), TPQ)
    with open(out, 'wb') as f:
        f.write(hdr + b''.join(trks))


def accomp_bar(t0, ch, sec, bar_in_sec, out):
    e8 = TPQ // 2
    root = pitch(CHORD[ch][0] + '2')
    if root < pitch('D2'):
        root += 12
    soft = sec in ('intro', 'A')
    if sec != 'intro' or bar_in_sec >= 2:
        for i in range(8):
            acc = i in (0, 3, 6)
            v = (88 if acc else 66) if soft else (100 if acc else 78)
            out['bass'].append((t0 + i * e8, e8 - 20, root + (12 if i % 2 else 0), v))
    if sec in ('A', 'B', 'C'):
        voic = tones(ch, pitch('E4'))[:4]
        pv = 70 if sec == 'A' else 84
        for st, ln in ((0, 3), (3, 3), (6, 2)):
            for p in voic:
                out['piano'].append((t0 + st * e8, ln * e8 - 30, p, pv))
    arp = tones(ch, pitch('A3'))[:5]
    seq = arp + arp[-2:0:-1]
    # density grows by section: intro quarters -> A eighths -> B/C sixteenths
    step, n, v_hi, v_lo = {'intro': (TPQ, 4, 58, 52), 'A': (TPQ // 2, 8, 62, 52)}.get(sec, (S16, 16, 76, 62))
    for i in range(n):
        out['dulc'].append((t0 + i * step, step if step > S16 else S16, seq[i % len(seq)], v_hi if i % 4 == 0 else v_lo))
    if sec in ('intro', 'B', 'C'):
        for p in tones(ch, pitch('F3'))[:3]:
            out['strings'].append((t0, BAR - 10, p, 56 if sec == 'intro' else 62))
    d = out['drums']
    if sec == 'intro':
        if bar_in_sec == 3:
            for i in range(8):
                d.append((t0 + 2 * TPQ + i * S16, S16, 38, 60 + i * 5))
        return
    if sec == 'A':  # half-time
        for i in range(8):
            d.append((t0 + i * e8, 60, 42, 58 if i % 2 == 0 else 42))
        d.append((t0, 60, 36, 92))
        d.append((t0 + 3 * e8, 60, 36, 80))
        d.append((t0 + 4 * e8, 60, 37, 80))  # side stick on 3
        if bar_in_sec == 0:
            d.append((t0, 200, 49, 80))
        return
    for i in range(8):
        d.append((t0 + i * e8, 60, 42, 70 if i % 2 == 0 else 50))
    for i in (0, 3):
        d.append((t0 + i * e8, 60, 36, 100))
    for i in (2, 6):
        d.append((t0 + i * e8, 60, 38, 92))
    if bar_in_sec % 8 == 0:
        d.append((t0, 200, 49, 90 if sec == 'C' else 78))
    if bar_in_sec % 8 == 7:
        for i in range(4):
            d.append((t0 + 3 * TPQ + i * S16, S16, 38, 70 + i * 8))


SONG_MAO = [
    # (section, chords, melody)
    ('intro', ['F', 'C', 'Dm', 'C7'],
     "r:16 r:16 r:16 r:2 F5:1 G5:1 A5:1 Bb5:1 C6:1 D6:1 E6:1 F6:1 G6:6"),
    ('A', ['Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'Gm', 'A'],
     "A5:6 G5:2 F5:4 D5:4 "
     "F5:6 G5:6 A5:4 "
     "C6:6 A5:6 G5:4 "
     "A5:12 r:4 "
     "A5:6 C6:2 D6:4 A5:4 "
     "^C6 D6:6 F6:6 D6:4 "
     "C6:6 A5:6 G5:4 "
     "A5:10 r:2 C#6:2 E6:2"),
    ('B', ['Bb', 'C', 'Am', 'Dm', 'Gm', 'Gm', 'C', 'C7'],
     "D6:2 D6:2 F6:2 D6:2 C6:4 A5:4 "
     "C6:2 C6:2 E6:2 C6:2 A5:4 G5:4 "
     "E6:2 E6:2 G6:2 E6:2 D6:4 C6:4 "
     "D6:8 A5:4 D6:4 "
     "G5:3 Bb5:3 D6:2 G6:6 F6:2 "
     "^E6 F6:6 D6:6 Bb5:4 "
     "C6:4 E6:4 G6:4 C7:4 "
     "G6:8 r:4 F6:2 E6:2"),
    ('C', SKETCH['A']['chords'] * 2, SKETCH['A']['mel'] + ' ' + SKETCH['A']['mel']),
]


def build_song(song, tempo, out):
    o = {k: [] for k in ('lead', 'dbl', 'bass', 'piano', 'dulc', 'strings', 'drums')}
    t = 0
    for sec, chords, mel in song:
        ev, length = melody(mel, 84 if sec == 'A' else 96)
        assert length == len(chords) * BAR, (sec, length / BAR)
        o['lead'] += [(t + a, d, p, v) for a, d, p, v in ev]
        if sec == 'C':
            half = len(chords) // 2 * BAR
            o['dbl'] += [(t + a, d, p - 12, v - 20) for a, d, p, v in ev if a >= half]
        for i, ch in enumerate(chords):
            accomp_bar(t + i * BAR, ch, sec, i, o)
        t += length
    trks = [
        track([], 0, None, 'Conductor', tempo),
        track(o['lead'], 0, 73, 'Flute'),
        track(o['dbl'], 1, 40, 'Violin'),
        track(o['piano'], 2, 0, 'Piano'),
        track(o['dulc'], 3, 15, 'Dulcimer'),
        track(o['strings'], 4, 48, 'Strings'),
        track(o['bass'], 5, 33, 'Bass'),
        track(o['drums'], 9, None, 'Drums'),
    ]
    hdr = b'MThd' + struct.pack('>IHHH', 6, 1, len(trks), TPQ)
    with open(out, 'wb') as f:
        f.write(hdr + b''.join(trks))
    return t // BAR


if __name__ == '__main__':
    outdir = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] == 'song':
        bars = build_song(SONG_MAO, 150, f'{outdir}/mao-bgm-draft.mid')
        print('bars', bars, 'L', bars * 4 * 60 / 150)
    else:
        for k in SKETCH:
            build(k, 150, f'{outdir}/mao-sketch-{k}.mid')
        print('ok')

