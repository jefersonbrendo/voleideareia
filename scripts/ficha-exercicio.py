"""
Mostra, para cada exercício, o texto (Como montar + Passo a passo) e a cena (ids de jogadores,
cones, zonas e setas), para escrever a linha do tempo em src/data/animacoes*.ts.

Uso: python -I scripts/ficha-exercicio.py 10 11 12      (números)
     python -I scripts/ficha-exercicio.py 10-20          (intervalo)
"""
import json, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def exercicios():
    with open(os.path.join(RAIZ, 'index.html'), encoding='utf-8') as fh:
        for linha in fh:
            if linha.startswith('const EX = ['):
                return {e['numero']: e for e in json.loads(linha[len('const EX = '):].rstrip().rstrip(';'))}
    raise SystemExit('lista de exercícios não encontrada')


def ficha(ex, cena):
    n = ex['numero']
    out = [f"=== #{n} {ex['nome']} | seção {ex['secao']} | {ex.get('jogadores','')} | {ex.get('tempo','')}"]
    out.append('MONTAR: ' + (ex.get('comoMontar') or ''))
    for i, p in enumerate(ex.get('passoAPasso') or [], 1):
        out.append(f'  {i}. {p}')
    jog = [f"{e['id']}({e['x']:.0f},{e['y']:.0f})" for e in cena['el'] if e['k'] == 'jogador']
    cones = [f"{e['id']}({e['x']:.0f},{e['y']:.0f})" for e in cena['el'] if e['k'] == 'cone']
    zonas = [f"{e['id']}({e['x']:.0f},{e['y']:.0f})" for e in cena['el'] if e['k'] == 'zona']
    bola = [f"({e['x']:.0f},{e['y']:.0f})" for e in cena['el'] if e['k'] == 'bola']
    out.append('JOGADORES: ' + ' '.join(jog))
    if cones: out.append('CONES: ' + ' '.join(cones))
    if zonas: out.append('ZONAS: ' + ' '.join(zonas))
    if bola: out.append('BOLA(estática): ' + ' '.join(bola))
    nums = {}
    for e in cena['el']:
        if e['k'] == 'numero' and e.get('seta'):
            nums.setdefault(e['seta'], []).append(e['t'])
    for e in cena['el']:
        if e['k'] != 'seta' or e.get('junto'):
            continue
        cor = e.get('s') or e.get('cor') or ''
        tipo = 'BOLA(verm)' if cor in ('#dc2626', '#ea580c') else 'DESLOC(escura)' if cor in ('#0f172a', '#000000', '#1e293b', '#475569') else f'cor{cor}'
        b = e.get('b')
        sem = [p for p in cena['el'] if p['k'] == 'ponta' and p.get('de') == e['id']]
        out.append(f"  {e['id']:>6} {tipo:14} {e['a']}->{b} n={','.join(nums.get(e['id'], []))} {'tracej' if e.get('da') else ''}{' cabeça@' + sem[0]['lado'] if sem else ' (sem cabeça ligada)'}")
    sol = [p for p in cena['el'] if p['k'] == 'ponta' and 'de' not in p]
    if sol:
        out.append('  !! pontas de seta sem ligação em: ' + ' '.join(f"({p['x']:.0f},{p['y']:.0f})" for p in sol))
    soltos = [f"'{e['t'][:30]}'({e['x']:.0f},{e['y']:.0f})" for e in cena['el'] if e['k'] == 'texto']
    if soltos: out.append('TEXTOS: ' + ' '.join(soltos))
    return '\n'.join(out)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    EX = exercicios()
    alvo = []
    for a in sys.argv[1:]:
        if '-' in a:
            i, f = a.split('-'); alvo += range(int(i), int(f) + 1)
        else:
            alvo.append(int(a))
    for n in alvo:
        with open(os.path.join(RAIZ, 'public', 'gem', 'diagramas', f'{n:03d}.json'), encoding='utf-8') as fh:
            print(ficha(EX[n], json.load(fh)))
        print()


if __name__ == '__main__':
    main()
