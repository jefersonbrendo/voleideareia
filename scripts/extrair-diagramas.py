"""
Extrai os diagramas de quadra do PDF "Guia de Treinos de Vôlei de Praia" como DADOS (cena vetorial),
em vez de imagem. Cada exercício vira public/gem/diagramas/NNN.json, que o app redesenha em SVG
e anima.

Uso (precisa de pymupdf):
    python scripts/extrair-diagramas.py "C:/caminho/Guia-de-Treinos-Volei-de-Praia-240-exercicios.pdf"
    python scripts/extrair-diagramas.py PDF --resumo 100        # imprime os elementos de um exercício

Unidades: pontos do PDF, com origem no canto superior esquerdo do diagrama (w x h ~ 278 x 144).

Papéis (campo "k"): quadra, rede, zona, jogador, numero, cone, seta, ponta (cabeça da seta),
texto e fundo (qualquer outro desenho, preservado como está). O desenho é sempre fiel ao PDF;
o papel só serve para saber o que animar.
"""
import json
import math
import os
import re
import sys

import pymupdf

SAIDA = os.path.join(os.path.dirname(__file__), '..', 'public', 'gem', 'diagramas')

JOGADOR = {'#0284c7', '#0f766e', '#d97706', '#7e22ce', '#475569', '#f59e0b', '#dc2626'}
CONE = {'#f97316', '#ea580c', '#f59e0b'}
ZONA = {'#059669', '#10b981', '#0ea5e9', '#0284c7', '#f3e8ff', '#047857', '#f59e0b', '#d97706'}


def hexcor(c):
    return None if c is None else '#%02x%02x%02x' % tuple(int(round(v * 255)) for v in c)


def arecia(f):
    return f is not None and f[0] > .75 and f[1] > .6 and f[2] < .85 and not (f[0] > .98 and f[1] > .98 and f[2] > .98)


def retangulo_do_diagrama(page):
    pw = page.rect.width
    rs = [p['rect'] for p in page.get_drawings()
          if p.get('fill') and arecia(p['fill']) and p['rect'].width > 50 and p['rect'].height > 30 and not (p['rect'].width > pw * .9)]
    if not rs:
        return None
    return pymupdf.Rect(min(r.x0 for r in rs), min(r.y0 for r in rs), max(r.x1 for r in rs), max(r.y1 for r in rs))


def caminho(p, ox, oy):
    def f(pt):
        return f'{pt.x - ox:.1f} {pt.y - oy:.1f}'
    d, atual = [], None
    for it in p['items']:
        k = it[0]
        if k == 'l':
            a, b = it[1], it[2]
            if atual is None or math.dist((atual.x, atual.y), (a.x, a.y)) > .05:
                d.append('M' + f(a))
            d.append('L' + f(b))
            atual = b
        elif k == 'c':
            a, b, c, e = it[1], it[2], it[3], it[4]
            if atual is None or math.dist((atual.x, atual.y), (a.x, a.y)) > .05:
                d.append('M' + f(a))
            d.append(f'C{f(b)} {f(c)} {f(e)}')
            atual = e
        elif k == 're':
            r = it[1]
            d.append(f'M{r.x0 - ox:.1f} {r.y0 - oy:.1f}H{r.x1 - ox:.1f}V{r.y1 - oy:.1f}H{r.x0 - ox:.1f}Z')
            atual = None
        elif k == 'qu':
            q = it[1]
            d.append('M' + f(q.ul) + 'L' + f(q.ur) + 'L' + f(q.lr) + 'L' + f(q.ll) + 'Z')
            atual = None
    if p.get('closePath'):
        d.append('Z')
    return ''.join(d)


def pontas_do_caminho(p, ox, oy):
    its = p['items']
    a = its[0][1]
    ult = its[-1]
    b = ult[-1] if ult[0] in ('l', 'c') else ult[1].br
    return [round(a.x - ox, 1), round(a.y - oy, 1)], [round(b.x - ox, 1), round(b.y - oy, 1)]


def extremos(pts):
    """Par de pontos mais distantes de uma forma (as duas pontas de uma seta pontilhada)."""
    melhor, dist = (pts[0], pts[0]), -1
    for i, a in enumerate(pts):
        for b in pts[i + 1:]:
            dd = math.dist(a, b)
            if dd > dist:
                melhor, dist = (a, b), dd
    return [round(melhor[0][0], 1), round(melhor[0][1], 1)], [round(melhor[1][0], 1), round(melhor[1][1], 1)]


def orientar_setas_preenchidas(els):
    """
    Seta pontilhada: só sabemos as duas pontas da forma. A de chegada (b) é a que tem uma cabeça
    (ponta) logo ao lado; se não houver cabeça separada, a de partida (a) é a mais perto de um jogador.
    """
    cabecas = [(e['x'], e['y']) for e in els if e['k'] == 'ponta']
    jogadores = [(e['x'], e['y']) for e in els if e['k'] == 'jogador']

    def perto(pt, grupo):
        return min((math.dist(pt, q) for q in grupo), default=1e9)

    for e in els:
        if e['k'] != 'seta' or not e.pop('_pts', False):
            continue
        ha, hb = perto(e['a'], cabecas), perto(e['b'], cabecas)
        if min(ha, hb) < 6:
            if ha < hb:
                e['a'], e['b'] = e['b'], e['a']
        elif perto(e['b'], jogadores) < perto(e['a'], jogadores):
            e['a'], e['b'] = e['b'], e['a']


def agrupar_pecas_da_mesma_seta(els):
    """
    Uma seta pontilhada é desenhada em mais de uma peça (fileira de pontos + forma preta) com as
    mesmas pontas. A primeira peça manda; as outras ganham `junto` e são animadas com ela.
    """
    pre = [e for e in els if e['k'] == 'seta' and e.get('pre')]
    for i, e in enumerate(pre):
        if e.get('junto'):
            continue
        for o in pre[i + 1:]:
            if o.get('junto'):
                continue
            mesmas = math.dist(e['a'], o['a']) < 3.5 and math.dist(e['b'], o['b']) < 3.5
            trocadas = math.dist(e['a'], o['b']) < 3.5 and math.dist(e['b'], o['a']) < 3.5
            if mesmas or trocadas:
                o['junto'] = e['id']


def ligar_ids_de_zonas(els):
    """Cada zona é feita de duas formas (preenchimento e borda pontilhada) com o mesmo centro: mesmo id."""
    centros = []
    for e in els:
        if e['k'] != 'zona':
            continue
        achou = next((c for c in centros if math.dist(c[0], (e['x'], e['y'])) < 1.5), None)
        if not achou:
            achou = ((e['x'], e['y']), f'zona{len(centros) + 1}')
            centros.append(achou)
        e['id'] = achou[1]


def ligar_numeros_as_setas(els):
    """Número vermelho acompanha seta vermelha (bola); número escuro, seta escura (deslocamento)."""
    setas = [e for e in els if e['k'] == 'seta' and not e.get('junto')]

    def familia(cor):
        return 'v' if cor in ('#dc2626', '#ea580c') else 'e'

    por_familia = {'v': [s for s in setas if familia(s.get('s') or s.get('cor') or '') == 'v'],
                   'e': [s for s in setas if familia(s.get('s') or s.get('cor') or '') == 'e']}
    for n in els:
        if n['k'] != 'numero':
            continue
        fam = familia(n['f'])
        # regra do guia: o N-ésimo círculo de uma cor é a N-ésima seta dessa cor (ordem de desenho)
        if n['t'].isdigit() and 1 <= int(n['t']) <= len(por_familia[fam]):
            n['seta'] = por_familia[fam][int(n['t']) - 1]['id']
            continue
        melhor, dist = None, 1e9
        for s in setas:
            if familia(s.get('s') or s.get('cor') or '') != fam:
                continue
            meio = ((s['a'][0] + s['b'][0]) / 2, (s['a'][1] + s['b'][1]) / 2)
            dd = min(math.dist((n['x'], n['y']), meio), math.dist((n['x'], n['y']), s['a']), math.dist((n['x'], n['y']), s['b']))
            if dd < dist:
                melhor, dist = s, dd
        if melhor and dist < 40:
            n['seta'] = melhor['id']


def tracejado(p):
    d = p.get('dashes')
    if not d:
        return None
    nums = re.findall(r'[\d.]+', d.split(']')[0])
    nums = [float(n) for n in nums]
    return nums if nums and any(n > 0 for n in nums) else None


def sobrepoe(r, R):
    return r.x0 <= R.x1 and r.x1 >= R.x0 and r.y0 <= R.y1 and r.y1 >= R.y0


def eh_circulo(p):
    return all(i[0] == 'c' for i in p['items']) and len(p['items']) >= 3 and abs(p['rect'].width - p['rect'].height) < 1.2


def base_do_desenho(p, ox, oy):
    e = {'d': caminho(p, ox, oy)}
    if p.get('fill') is not None:
        e['f'] = hexcor(p['fill'])
        if p.get('fill_opacity') not in (None, 1, 1.0):
            e['fo'] = round(p['fill_opacity'], 2)
    if p.get('color') is not None:
        e['s'] = hexcor(p['color'])
        e['w'] = round(p.get('width') or 1, 2)
        if p.get('stroke_opacity') not in (None, 1, 1.0):
            e['so'] = round(p['stroke_opacity'], 2)
        td = tracejado(p)
        if td:
            e['da'] = td
        if p.get('lineCap') and p['lineCap'][0] == 1:
            e['lc'] = 'round'
    if p.get('even_odd'):
        e['eo'] = 1
    return e


def extrair(page):
    R = retangulo_do_diagrama(page)
    if R is None:
        return None
    ox, oy = R.x0, R.y0
    textos = []
    for b in page.get_text('dict', clip=R)['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if s['text'].strip():
                    x0, y0, x1, y1 = s['bbox']
                    textos.append({'t': s['text'].strip(), 'x': round((x0 + x1) / 2 - ox, 1), 'y': round((y0 + y1) / 2 - oy, 1),
                                   'fs': round(s['size'], 1), 'c': '#%06x' % s['color'], 'b': 1 if s['flags'] & 16 else 0, 'usado': False})

    def texto_em(cx, cy, tol, padrao=None):
        """Texto livre mais perto de (cx, cy) que combine com o padrão (ex.: J1, A1 ou um número)."""
        melhor, dist = None, 1e9
        for t in textos:
            if t['usado'] or abs(t['x'] - cx) > tol or abs(t['y'] - cy) > tol:
                continue
            if padrao and not re.fullmatch(padrao, t['t']):
                continue
            dd = math.dist((t['x'], t['y']), (cx, cy))
            if dd < dist:
                melhor, dist = t, dd
        if melhor:
            melhor['usado'] = True
        return melhor

    els, contagem = [], {}

    def novo_id(prefixo):
        contagem[prefixo] = contagem.get(prefixo, 0) + 1
        return f'{prefixo}{contagem[prefixo]}'

    for p in page.get_drawings():
        r = p['rect']
        if not sobrepoe(r, R):
            continue
        fill, cor = hexcor(p.get('fill')), hexcor(p.get('color'))
        tam = max(r.width, r.height)
        cx, cy = round((r.x0 + r.x1) / 2 - ox, 1), round((r.y0 + r.y1) / 2 - oy, 1)
        if r.width > R.width * .98 and r.height > R.height * .98:
            e = base_do_desenho(p, ox, oy); e['k'] = 'moldura'; els.append(e); continue
        its = p['items']
        # quadra
        if fill and arecia(p['fill']) and r.width > 50 and r.height > 30 and its[0][0] == 're':
            e = base_do_desenho(p, ox, oy); e['k'] = 'quadra'; els.append(e); continue
        # jogador / número / bola
        if eh_circulo(p) and cor in ('#ffffff', '#facc15', '#0f172a') and fill:
            raio = round(r.width / 2, 1)
            if fill in ('#facc15', '#fef08a'):
                els.append({'k': 'bola', 'x': cx, 'y': cy, 'r': raio, 'f': fill, 's': cor, 'w': round(p.get('width') or 1, 2)}); continue
            grande = r.width >= 10 and fill in JOGADOR
            t = texto_em(cx, cy, max(raio, 3), r'[A-Z]{1,2}\d{0,2}' if grande else r'\d{1,2}')
            e = {'x': cx, 'y': cy, 'r': raio, 'f': fill, 's': cor, 'w': round(p.get('width') or 1, 2)}
            if grande:
                e['k'] = 'jogador'
                e['t'] = t['t'] if t else ''
                e['id'] = e['t'] or novo_id('J')
                if any(x.get('id') == e['id'] for x in els):
                    e['id'] = novo_id(e['id'] + '_')
            else:
                e['k'] = 'numero'
                e['t'] = t['t'] if t else ''
            if t:
                e['fs'] = t['fs']; e['tc'] = t['c']
            els.append(e); continue        # cone
        if fill in CONE and cor == '#ffffff' and all(i[0] == 'l' for i in its) and tam < 10:
            e = base_do_desenho(p, ox, oy); e['k'] = 'cone'; e['x'] = cx; e['y'] = cy; e['id'] = novo_id('cone'); els.append(e); continue
        # rede (traços e postes escuros e finos/altos)
        if fill == '#0f172a' and cor is None and ((r.height > 60 and r.width < 5) or (tam < 12 and 'c' in [i[0] for i in its] and abs((r.x0 + r.x1) / 2 - ox - R.width / 2) < R.width * .08)):
            e = base_do_desenho(p, ox, oy); e['k'] = 'rede'; els.append(e); continue
        # seta: só traço, colorido, sem preenchimento
        if fill is None and cor not in (None, '#ffffff') and its[0][0] in ('c', 'l') and tam >= 8:
            e = base_do_desenho(p, ox, oy); e['k'] = 'seta'; e['id'] = novo_id('seta')
            e['a'], e['b'] = pontas_do_caminho(p, ox, oy); e['cor'] = cor
            els.append(e); continue
        # seta pontilhada: desenhada como forma preenchida (pontos + cabeça no mesmo desenho)
        pontilhada_escura = fill == '#0f172a' and cor is None and all(i[0] == 'l' for i in its) and len(its) >= 8 and tam >= 6 and not (r.height > 60 and r.width < 5)
        if (fill == '#000000' and all(i[0] == 'l' for i in its) and tam >= 3) or pontilhada_escura:
            e = base_do_desenho(p, ox, oy); e['k'] = 'seta'; e['pre'] = 1; e['id'] = novo_id('seta')
            e['cor'] = cor or '#000000'
            pts = []
            for i in its:
                pts += [(q.x - ox, q.y - oy) for q in i[1:] if hasattr(q, 'x')]
            e['a'], e['b'] = extremos(pts)
            e['_pts'] = True
            els.append(e); continue
        # cabeça de seta: preenchida, pequena, sem contorno branco
        if fill and cor in (None, fill) and all(i[0] == 'l' for i in its) and tam < 10:
            e = base_do_desenho(p, ox, oy); e['k'] = 'ponta'; e['x'] = cx; e['y'] = cy; els.append(e); continue
        # zona
        if fill in ZONA and cor is None and its[0][0] in ('l', 'c') and tam >= 10:
            e = base_do_desenho(p, ox, oy); e['k'] = 'zona'; e['x'] = cx; e['y'] = cy; els.append(e); continue
        e = base_do_desenho(p, ox, oy); e['k'] = 'fundo'; e['x'] = cx; e['y'] = cy; els.append(e)

    orientar_setas_preenchidas(els)
    agrupar_pecas_da_mesma_seta(els)
    ligar_ids_de_zonas(els)
    # liga cada cabeça à seta cujo fim/começo está mais perto
    setas = [e for e in els if e['k'] == 'seta' and not e.get('junto')]

    def familia_cor(cor):
        return 'v' if cor in ('#dc2626', '#ea580c') else 'e'

    for e in els:
        if e['k'] != 'ponta':
            continue
        melhor, dist = None, 1e9
        for s in setas:
            # a cabeça é da seta da mesma cor (vermelha = bola, escura = deslocamento)
            if familia_cor(s.get('s') or s.get('cor') or '') != familia_cor(e.get('f')):
                continue
            for ponto, lado in ((s['b'], 'b'), (s['a'], 'a')):
                dd = math.dist(ponto, (e['x'], e['y']))
                if dd < dist:
                    melhor, dist = (s, lado), dd
        if melhor and dist < 9:
            e['de'] = melhor[0]['id']; e['lado'] = melhor[1]
    ligar_numeros_as_setas(els)
    for t in textos:
        if not t['usado']:
            els.append({'k': 'texto', 't': t['t'], 'x': t['x'], 'y': t['y'], 'fs': t['fs'], 'c': t['c'], 'b': t['b']})
    return {'w': round(R.width, 1), 'h': round(R.height, 1), 'el': els}


def resumo(cena):
    linhas = [f"cena {cena['w']} x {cena['h']}"]
    for e in cena['el']:
        k = e['k']
        if k == 'jogador':
            linhas.append(f"  jogador {e['id']:>6} ({e['x']:.0f},{e['y']:.0f}) cor {e['f']}")
        elif k == 'cone':
            linhas.append(f"  cone    {e['id']:>6} ({e['x']:.0f},{e['y']:.0f})")
        elif k == 'seta':
            if e.get('junto'):
                continue
            linhas.append(f"  seta    {e['id']:>6} {e['a']} -> {e['b']} cor {e.get('s', e.get('cor'))}{' tracejada' if e.get('da') else ''}{' (pontilhada preenchida)' if e.get('pre') else ''}")
        elif k == 'numero':
            linhas.append(f"  numero  '{e['t']}' ({e['x']:.0f},{e['y']:.0f}) cor {e['f']}")
        elif k == 'zona':
            linhas.append(f"  zona    ({e['x']:.0f},{e['y']:.0f}) cor {e['f']}")
        elif k == 'texto':
            linhas.append(f"  texto   '{e['t'][:50]}' ({e['x']:.0f},{e['y']:.0f})")
    return '\n'.join(linhas)


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    doc = pymupdf.open(sys.argv[1])
    paginas = {}
    for i in range(len(doc)):
        m = re.search(r'#(\d{3})', doc[i].get_text())
        if m and int(m.group(1)) not in paginas:
            paginas[int(m.group(1))] = i
    if '--resumo' in sys.argv:
        n = int(sys.argv[sys.argv.index('--resumo') + 1])
        print(resumo(extrair(doc[paginas[n]])))
        return
    os.makedirs(SAIDA, exist_ok=True)
    ok, sem = 0, []
    for n in sorted(paginas):
        cena = extrair(doc[paginas[n]])
        if cena is None:
            sem.append(n); continue
        with open(os.path.join(SAIDA, f'{n:03d}.json'), 'w', encoding='utf-8') as fh:
            json.dump(cena, fh, ensure_ascii=False, separators=(',', ':'))
        ok += 1
    print(f'cenas geradas: {ok}; sem diagrama: {sem}')


if __name__ == '__main__':
    main()
