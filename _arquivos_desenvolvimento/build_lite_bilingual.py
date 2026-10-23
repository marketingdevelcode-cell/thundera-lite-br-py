"""Five-slide fair deck. Spanish first, grouped Portuguese translations."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def pair(es,pt,tag='div',cls=''):
    return f'<{tag} class="pair {cls}"><span lang="es-PY" class="es">{es}</span><span lang="pt-BR" class="pt">{pt}</span></{tag}>'
def pt(text):return f'<div class="translation" lang="pt-BR"><span class="lang-tag">PT</span><div>{text}</div></div>'
def icon(name):
    paths={'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>','activity':'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4M6 12h3l2-5 3 8 2-3h2"/>','chart':'<path d="M4 3v17h17M8 16v-5M13 16V7M18 16V4"/>','video':'<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/>','ai':'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>','prev':'<path d="m15 5-7 7 7 7"/>','next':'<path d="m9 5 7 7-7 7"/>','map':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>','full':'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>'}
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[name]+'</svg>'
slides=[]
def slide(n,es,port,title,titlept,body,note='',notept='',cls=''):
    slides.append(f'''<section id="slide-{n}" class="slide {cls} {'active' if n==1 else ''}" data-title="{es}" data-title-pt="{port}" aria-hidden="{'false' if n==1 else 'true'}"{' inert' if n!=1 else ''}>
    <header><div class="brand"><img src="assets/logo-amarelo-branco.png" alt="Thundera IA"><b>LITE</b></div><span class="slide-index">{n:02}<i>/ 05</i></span></header>
    {pair(title,titlept,'h1' if n==1 else 'h2','headline')}
    <div class="body">{body}</div>
    <footer>{pair(note,notept,cls='footnote') if note else ''}</footer></section>''')

slide(1,'El valor del tiempo','O valor do tempo','Recuperar tiempo <em>tiene valor.</em>','Recuperar tempo tem valor.',f'''
    <div class="opening-grid">
      <div class="opening-message">{pair('Thundera IA Lite muestra dónde actuar.','O Thundera IA Lite mostra onde agir.','p','lead')}<div class="hours"><strong>220<span> h</span></strong>{pair('de capacidad al mes','de capacidade por mês',cls='label')}</div></div>
      <div class="value-panel">{pair('Valor mensual equivalente','Valor mensal equivalente',cls='label')}<div class="value"><small>Gs.</small>8.800.000</div><div class="premises" lang="es-PY"><b>30 min</b> por persona al día<br>20 personas · 22 días · Gs. 40.000/h</div>{pt('30 min por pessoa ao dia<br>20 pessoas · 22 dias · Gs. 40.000/h')}</div>
    </div>''','Escenario hipotético. Capacidad valorizada al costo por hora, no ahorro garantizado.','Cenário hipotético. Capacidade valorizada ao custo por hora, não economia garantida.')

legend=''.join(f'<div class="legend-row"><i style="background:{color}"></i><span lang="es-PY">{name}</span><strong>{hours}</strong><small>{pct}</small></div>' for color,name,hours,pct in [('#ffca28','Reuniones','4h15','53%'),('#6aaeff','Tiempo activo','2h33','32%'),('#758398','Inactividad','1h12','15%')])
bars=''.join(f'<div class="bar-row"><span>{name}</span><strong>{hours}</strong><div class="bar"><i style="width:{width}%;background:{color}"></i></div></div>' for name,hours,width,color in [('Microsoft Teams','3h15',100,'#9aabff'),('Microsoft Outlook','1h45',53.85,'#6aaeff'),('web.whatsapp.com','1h20',41.03,'#64d3ad')])
slide(2,'La jornada visible','A jornada visível','Sepa <em>dónde se va el tiempo.</em>','Saiba para onde o tempo vai.',f'''
    <div class="dashboard">
      <article class="panel distribution"><div class="panel-title" lang="es-PY">Jornada de 8 horas</div><div class="chart-area"><div class="donut"><div><strong>53%</strong><span lang="es-PY">en reuniones</span></div></div><div class="legend">{legend}</div></div>{pt('<b>Jornada de 8 horas</b><br>53% em reuniões · 32% de tempo ativo · 15% de inatividade')}</article>
      <article class="panel usage"><div class="panel-title" lang="es-PY">Aplicaciones y sitios</div><div class="bars">{bars}</div>{pt('<b>Aplicativos e sites</b><br>Tempo de uso por ferramenta')}</article>
    </div>''','Datos ilustrativos. Los tiempos pueden superponerse y requieren contexto.','Dados ilustrativos. Os tempos podem se sobrepor e exigem contexto.')

features=[('clock','Horarios','Horários','Jornada y desviaciones.','Jornada e desvios.'),('activity','Actividades','Atividades','Aplicaciones y sitios.','Aplicativos e sites.'),('chart','Paneles','Painéis','Personas y equipos.','Pessoas e equipes.'),('video','Pantalla HD','Tela HD','Grabación para investigar.','Gravação para investigar.'),('ai','Informe con IA','Relatório com IA','Análisis y recomendaciones.','Análise e recomendações.')]
cards=''.join(f'<article class="feature {"featured" if i==4 else ""}"><div class="feature-icon">{icon(ic)}</div><div class="feature-es" lang="es-PY"><h3>{es}</h3><p>{desc}</p></div>{pt(f"<b>{port}</b><br>{descpt}")}</article>' for i,(ic,es,port,desc,descpt) in enumerate(features))
slide(3,'Recursos del Lite','Recursos do Lite','Todo para <em>ver y actuar.</em>','Tudo para enxergar e agir.',f'<div class="features">{cards}</div>')

slide(4,'El informe de IA','O relatório da IA','La IA explica <em>qué revisar.</em>','A IA explica o que revisar.',f'''
    <div class="report-layout"><div class="report-claim"><span class="ai-mark">IA</span>{pair('Los datos llegan con análisis.','Os dados chegam com análise.','p','lead')}{pair('Ejemplo de informe','Exemplo de relatório',cls='sample')}</div>
      <article class="report"><div class="report-es" lang="es-PY"><div class="report-row"><span>01</span><div><h3>Detecta</h3><p>Las reuniones ocupan 53% de la jornada.</p></div></div><div class="report-row"><span>02</span><div><h3>Interpreta</h3><p>Queda menos tiempo para el trabajo individual.</p></div></div><div class="report-row"><span>03</span><div><h3>Recomienda</h3><p>Revisar reuniones y reservar un bloque de concentración.</p></div></div></div>{pt('<b>Detecta:</b> reuniões ocupam 53% da jornada.<br><b>Interpreta:</b> sobra menos tempo para o trabalho individual.<br><b>Recomenda:</b> revisar reuniões e reservar um bloco de foco.')}</article></div>''','Ejemplo ilustrativo. El gestor valida la recomendación según la función.','Exemplo ilustrativo. O gestor valida a recomendação conforme a função.')

slide(5,'Próximo paso','Próximo passo','Descubra <em>su oportunidad de mejora.</em>','Descubra sua oportunidade de melhoria.',f'''
    <div class="closing-grid"><div class="closing-copy">{pair('¿Dónde puede recuperar tiempo su equipo?','Onde sua equipe pode recuperar tempo?','p','lead')}<div class="cta">{pair('Solicite una demostración','Solicite uma demonstração')}</div></div>
    <div class="next-steps"><div class="next-es" lang="es-PY"><div><span>01</span><h3>Vea el panel y el informe de IA.</h3></div><div><span>02</span><h3>Defina un piloto con su equipo.</h3></div></div>{pt('<b>01</b> Veja o painel e o relatório da IA.<br><b>02</b> Defina um piloto com sua equipe.')}</div></div>''','Converse con nuestro equipo en el stand.','Converse com nossa equipe no estande.')

controls=f'''<nav id="controls" aria-label="Navegación / Navegação"><button id="prev" aria-label="Anterior">{icon('prev')}</button><span id="counter">01 / 05</span><div id="slide-dots"></div><button id="next" aria-label="Siguiente / Próximo">{icon('next')}</button><button id="map-button" aria-label="Índice">{icon('map')}</button><button id="fullscreen" aria-label="Pantalla completa / Tela cheia">{icon('full')}</button></nav><dialog id="map-dialog"><div class="map-heading">{pair('Presentación','Apresentação')}<button id="map-close" aria-label="Cerrar / Fechar">×</button></div><div class="map-grid" id="map-grid"></div></dialog>'''
html='<!DOCTYPE html><html lang="es-PY"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thundera IA Lite · Paraguay · ES / PT</title><link rel="stylesheet" href="style/lite.css"><script src="js/lite.js" defer></script></head><body><main id="viewport"><div id="deck">'+''.join(slides)+'</div></main>'+controls+'</body></html>'
(ROOT/'index_lite.html').write_text(html,encoding='utf-8')
print('Built 5 simplified bilingual slides.')
