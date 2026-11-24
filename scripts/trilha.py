"""Trilhas originais dos reels da PONCI, sintetizadas do zero (sem samples de terceiros, sem direitos a pagar).
Uso: python3 scripts/trilha.py <pasta de saída>   ->  gera atelie.wav, vitrine.wav, parede.wav, feira.wav (44,1 kHz, estéreo, ~45 s)
"""
import sys, wave, numpy as np

SR = 44100
rng = np.random.default_rng(7)
mid = lambda n: 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, d=1.0):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    k = max(1, int(a * SR)); e[:k] *= np.linspace(0, 1, k)
    return e


def epiano(f, dur, vel=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) * env(n, .004, 1.3)
         + .32 * np.sin(2 * np.pi * 2 * f * t + .3) * env(n, .003, .55)
         + .16 * np.sin(2 * np.pi * 3 * f * t) * env(n, .002, .35)
         + .07 * np.sin(2 * np.pi * 4 * f * t) * env(n, .002, .2)
         + .05 * np.sin(2 * np.pi * 7.1 * f * t) * env(n, .001, .06))   # o "tine"
    s *= 1 + .08 * np.sin(2 * np.pi * 4.5 * t)                         # leve trêmolo
    k = int(.06 * SR); s[-k:] *= np.linspace(1, 0, k)
    return s * vel


def pad(f, dur, vel=.2):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * h * t * (1 + dt)) / h for h in (1, 2, 3) for dt in (-.003, .003))
    e = np.minimum(1, t / .8) * np.minimum(1, (dur - t) / .8).clip(0)
    return s * e * vel / 4


def bass(f, dur, vel=.6):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .18 * np.sin(6 * np.pi * f * t)  # harmônicos: o baixo aparece no alto-falante do celular
    e = env(n, .008, .45); k = int(.03 * SR); e[-k:] *= np.linspace(1, 0, k)
    return s * e * vel * .55


def kick(vel=.9):
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t / .04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .16) * vel * .5


def noise(n):
    return rng.standard_normal(n)


def hat(vel=.15, d=.035):
    n = int(.15 * SR); x = np.diff(noise(n + 1)); x = np.convolve(x, [.25, .5, .25], 'same')  # tira o chiado acima de ~12 kHz
    return x * env(n, .0005, d) * vel


def rim(vel=.3):
    n = int(.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 820 * t) * env(n, .0005, .018) + .5 * np.diff(noise(n + 1)) * env(n, .0005, .01)) * vel


def clap(vel=.35):
    n = int(.25 * SR); x = np.diff(noise(n + 1)); x = x - .6 * np.roll(x, 3)
    e = env(n, .001, .07)
    for o in (0, .011, .022): e += env(n, .0005, .008) * (np.arange(n) >= o * SR)
    return x * e * vel / 2


def tom(f=95, vel=.5):
    n = int(.5 * SR); t = np.arange(n) / SR
    fr = f * (1 + .4 * np.exp(-t / .03))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .002, .22) * vel


class Mix:
    def __init__(self, sec):
        self.L = np.zeros(int(sec * SR)); self.R = np.zeros(int(sec * SR))

    def add(self, x, at, pan=0.0):
        i = int(at * SR)
        if i >= len(self.L): return
        x = x[: len(self.L) - i]
        self.L[i:i + len(x)] += x * (1 - pan) ** .5 * .9
        self.R[i:i + len(x)] += x * (1 + pan) ** .5 * .9

    def out(self, verb=.2, crackle=0.0, lowcut=True):
        n = len(self.L)
        ir_n = int(2.2 * SR); t = np.arange(ir_n) / SR; m = 1 << (n + ir_n).bit_length()
        def IR():
            ir = noise(ir_n) * np.exp(-t / .55); ir = np.convolve(ir, np.ones(6) / 6, 'same'); ir /= np.abs(ir).sum() / 40
            return np.fft.rfft(ir, m)
        wet = [np.fft.irfft(np.fft.rfft(c, m) * IR(), m)[:n] for c in (self.L, self.R)]  # IR diferente por lado = largura
        L = self.L + verb * wet[0]; R = self.R + verb * wet[1] * .97
        if crackle:
            pops = (rng.random(n) < 6 / SR) * rng.standard_normal(n) * .5
            hiss = np.convolve(noise(n), np.ones(30) / 30, 'same') * .02
            L += crackle * (pops + hiss); R += crackle * (np.roll(pops, 37) + hiss)
        st = np.stack([L, R])
        # EQ de master pensado pro celular: segura o grave abaixo de 120 Hz e abre o brilho acima de 2 kHz
        f = np.fft.rfftfreq(n, 1 / SR)
        g = np.where(f < 30, 0, 1) * (1 - .45 * np.clip((120 - f) / 80, 0, 1)) * (1 + 1.2 * np.clip((f - 1500) / 3000, 0, 1)) / (1 + (f / 9000) ** 4) * (1 + .6 * np.clip((f - 500) / 1000, 0, 1) * (f < 2500))
        st = np.fft.irfft(np.fft.rfft(st, axis=1) * g, n, axis=1)
        rms = np.sqrt((st ** 2).mean()); st *= .16 / rms        # loudness parecida entre as trilhas
        st = np.tanh(st * 1.1) / np.tanh(1.1)                     # cola e segura picos
        st *= .89 / np.abs(st).max()                               # ~ -1 dBFS
        fade = int(1.5 * SR); st[:, -fade:] *= np.linspace(1, 0, fade)
        return st


def save(path, st):
    data = (st.T * 32767).astype('<i2').tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)


def voicing(ch):
    return [mid(n) for n in ch]


# ---------- 1) Ateliê: bossa lo-fi, 86 bpm ----------
def atelie(sec=46):
    b = 60 / 86; m = Mix(sec); bar = 4 * b
    prog = [([55, 59, 62, 66], 43), ([54, 57, 61, 64], 42), ([52, 55, 59, 62], 40), ([55, 57, 61, 64, 67], 45)]  # Gmaj7 F#m7 Em7 A7(13)
    comp = [0, 1.5, 2.5, 3.5]                              # comping sincopado
    clave = [0, 1.5, 3, 4.5, 6, 6.5]                        # rim, padrão de bossa em 2 compassos (em tempos)
    t, i = 0.0, 0
    while t < sec:
        ch, root = prog[i % 4]
        for c in comp:
            sw = .04 if c % 1 else 0
            for k, f in enumerate(voicing(ch)): m.add(epiano(f, b * (1.2 if c else 1.6), .17), t + (c + sw) * b + k * .012, pan=-.25 + .12 * k)
        for pos, nt in ((0, root), (1.5, root + 7), (2, root + 7), (3.5, root)):
            m.add(bass(mid(nt - 12), b * .9, .55), t + pos * b)
        if i >= 1:
            for k in range(8): m.add(hat(.07 if k % 2 else .11, .03), t + k * b / 2 + (.035 if k % 2 else 0), pan=.35)
            for c in clave:
                if (i % 2 == 0 and c < 4) or (i % 2 == 1 and c >= 4): m.add(rim(.22), t + (c % 4) * b, pan=-.2)
            m.add(kick(.45), t); m.add(kick(.35), t + 2.5 * b)
        t += bar; i += 1
    # melodia simples no 2º ciclo
    mel = [(74, 0, 1.5), (73, 1.5, .5), (71, 2, 2), (69, 4, 1.5), (71, 5.5, .5), (73, 6, 2), (71, 8, 1), (69, 9, 1), (67, 10, 2), (69, 12, 3)]
    for rep in (1, 2):
        for n, at, d in mel: m.add(epiano(mid(n), d * b + .2, .16), (rep * 4 * bar) + at * b, pan=.15)
    return m.out(verb=.22, crackle=.35)


# ---------- 2) Vitrine: pop leve e animado, 112 bpm ----------
def vitrine(sec=46):
    b = 60 / 112; m = Mix(sec); bar = 4 * b
    prog = [([60, 64, 67, 72], 48), ([59, 62, 67, 71], 47), ([57, 60, 64, 69], 45), ([57, 60, 65, 69], 41)]  # C G/B Am F
    t, i = 0.0, 0
    while t < sec:
        ch, root = prog[i % 4]
        for k8 in range(8):
            if k8 in (0, 3, 4, 6, 7):
                for k, f in enumerate(voicing(ch)): m.add(epiano(f, b * .45, .13 if k8 else .17), t + k8 * b / 2, pan=-.3 + .2 * k)
        for k8 in range(8): m.add(bass(mid(root - 12 + (12 if k8 in (3, 7) else 0)), b * .4, .5), t + k8 * b / 2)
        if i >= 1:
            for q in range(4): m.add(kick(.6), t + q * b)
            for q in (1, 3): m.add(clap(.33), t + q * b, pan=.1)
            for k in range(16): m.add(hat(.05 + .05 * (k % 4 == 2), .025), t + k * b / 4, pan=.4)
        else:
            m.add(pad(mid(root + 12), bar, .15), t)
        t += bar; i += 1
    hook = [(76, 0), (79, .5), (81, 1), (79, 1.5), (76, 2.5), (74, 3), (72, 3.5)]
    for rep in range(2, 12, 2):
        for n, at in hook: m.add(epiano(mid(n + 12), .5, .1), rep * bar + at * b, pan=.25)
    return m.out(verb=.16)


# ---------- 3) Parede: calma, piano e pad, 72 bpm ----------
def parede(sec=46):
    b = 60 / 72; m = Mix(sec); bar = 4 * b
    prog = [([53, 57, 60, 64], 41), ([57, 60, 64, 67], 45), ([50, 57, 60, 64, 65], 38), ([58, 62, 65, 69], 46)]  # Fmaj7 Am7 Dm9 Bbmaj7
    t, i = 0.0, 0
    while t < sec:
        ch, root = prog[i % 4]
        notes = voicing(ch)
        arp = [0, 1, 2, 3, 2, 1, 2, 3]
        for k, a in enumerate(arp): m.add(epiano(notes[a % len(notes)] * 2, b * 1.4, .12 + .04 * (k == 0)), t + k * b / 2, pan=-.3 + .6 * (k / 7))
        for f in notes[:3]: m.add(pad(f, bar + .6, .16), t)
        m.add(bass(mid(root - 12), bar * .9, .35), t)
        t += bar; i += 1
    return m.out(verb=.32)


# ---------- 4) Feira: groove brasileiro (samba-funk leve), 98 bpm ----------
def feira(sec=46):
    b = 60 / 98; m = Mix(sec); bar = 4 * b
    prog = [([57, 60, 64, 67], 45), ([54, 57, 60, 62, 66], 50)]   # Am7  D9
    t, i = 0.0, 0
    while t < sec:
        ch, root = prog[i % 2]
        for pos in (0, .75, 1.5, 2.5, 3.25):
            for k, f in enumerate(voicing(ch)): m.add(epiano(f, b * .35, .14), t + pos * b + k * .006, pan=-.35 + .15 * k)
        for pos, iv in ((0, 0), (.75, 0), (1.5, 7), (2, 12), (2.75, 10), (3.5, 7)):
            m.add(bass(mid(root - 12 + iv), b * .45, .55), t + pos * b)
        if i >= 1:
            for k in range(16): m.add(hat(.09 + .1 * (k % 4 == 0) + .05 * (k % 2), .025), t + k * b / 4, pan=.45)   # ganzá
            m.add(kick(.55), t); m.add(kick(.4), t + 2 * b + .75 * b)
            m.add(tom(70, .25), t + 1 * b, pan=-.1); m.add(tom(70, .35), t + 3 * b, pan=-.1)                        # surdo no 2 e no 4
            for pos in (.5, 1.75, 2.5, 3.75): m.add(rim(.16), t + pos * b, pan=.2)                                 # tamborim
        t += bar; i += 1
    riff = [(76, 0), (74, .5), (72, .75), (69, 1.5), (72, 2.5), (74, 3)]
    for rep in range(4, 18, 4):
        for n, at in riff: m.add(epiano(mid(n), .45, .12), rep * bar + at * b, pan=.2)
    return m.out(verb=.15)


if __name__ == '__main__':
    out = sys.argv[1]
    for name, fn in (('atelie', atelie), ('vitrine', vitrine), ('parede', parede), ('feira', feira)):
        save(f'{out}/{name}.wav', fn()); print('ok', name)
