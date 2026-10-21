# APEX — GT Endurance

Protótipo GT3 em JavaScript com ES Modules e Three.js r170. A refatoração mantém os três carros, Costa Dourada, as três voltas, os controles e o visual 3D estilizado. Sem frameworks, build ou dependências de instalação. Requer Node.js 20+ e navegador com WebGL 2.

## Executar localmente

```sh
npm start
```

Abra o endereço exibido no terminal, normalmente http://localhost:8000. Se a porta estiver ocupada, o servidor tenta as seguintes até 8009. Ctrl+C encerra o servidor. Não abra `index.html` via `file://`: os módulos precisam de HTTP. A fonte remota tem fallback local; a biblioteca Three.js está incluída.

```sh
npm test
```

## Cronometragem por corrida

O HUD mantém o tempo total e mostra **ATUAL**, **MELHOR** e **DIF. MELHOR**. ATUAL zera a cada volta; MELHOR considera somente voltas concluídas nesta corrida. Antes da primeira volta completa, melhor e diferença aparecem sem valor.

A diferença compara o tempo atual com o tempo da melhor volta no mesmo ponto do circuito: sinal negativo/verde indica ganho; positivo/laranja indica perda. A referência usa amostras privadas por distância, interpoladas, em `src/lap-timing.js`; `RACE.timingSampleDistance` configura o espaçamento (2 m). Na chegada, ATUAL conserva a última volta e a diferença usa essa volta contra a melhor final. A cronometragem existente foi preservada: a primeira volta inclui o deslocamento do grid à linha após a largada.

Pausar congela os tempos. Iniciar ou reiniciar uma corrida descarta toda a referência; não há armazenamento nem histórico entre corridas. Os onze testes atuais incluem comparação no mesmo ponto, troca da referência quando a volta melhora, proteção ao voltar pela pista e limpeza ao reiniciar. Oito testes citados abaixo descrevem a validação anterior da refatoração.

## Estrutura e responsabilidades

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html`, `style.css` | Estrutura e aparência da interface existente. |
| `bootstrap.js` | Carrega a aplicação e informa falha de inicialização. |
| `game.js` | Cria e conecta os sistemas, comandos e loop com passo fixo. |
| `src/config.js` | Parâmetros de carros, pista, física, corrida, IA e câmeras. |
| `src/race.js` | `RaceSimulation`: proprietário do estado e coordenador das regras. |
| `src/lap-timing.js` | Referência temporal privada da melhor volta e delta durante a corrida. |
| `src/rules.js` | Progresso por portões, voltas e classificação; sem DOM ou Three.js. |
| `src/physics.js` | Aceleração, freio, direção, aderência, recuperação e contatos do jogador; funções puras. |
| `src/opponents.js` | Grid, decisões de tráfego, trajetória e separação dos adversários; funções puras. |
| `src/track.js` | Curva fechada, amostras, posição, tangente e projeção na pista. Sem DOM ou renderer. |
| `src/scenery.js` | Asfalto, zebras, árvores, mar, boxes, arquibancada e pórtico. |
| `src/cars.js` | Modelos 3D, sincronização das poses e descarte de recursos. |
| `src/rendering.js` | Renderer, cena, luzes, sombras, resize e primitivas gráficas compartilhadas. |
| `src/cameras.js` | Modos de câmera, interpolação e campo de visão. |
| `src/controls.js` | Entrada do teclado e toque, limpeza ao perder foco e comandos. |
| `src/interface.js` | Menus, garagem, HUD, minimapa, resultado e tela cheia. |
| `src/audio.js` | AudioContext, preferência de som e atualização do motor. |
| `src/math.js` | Clamp, amortecimento e distâncias numa pista fechada, usados por vários sistemas. |
| `scripts/serve.mjs` | Servidor local Node, MIME dos módulos e cache desativado. |
| `tests/` | Regras isoladas e simulação de domínio sem DOM, mocks de GPU ou leitura de globais. |
| `three.module.js` | Biblioteca original, sem alterações internas. |

## Propriedade e atualização do estado

`RaceSimulation` mantém seu estado privado. `start()`, `menu()`, `selectCar()`, `togglePause()` e `step()` são os pontos de alteração. `state` entrega uma cópia; interface, carros, áudio e câmeras não podem modificar o estado interno. `ranking` calcula uma nova lista sem alterar os participantes.

Em cada passo de 1/120 s, a simulação atualiza contagem regressiva e tempos, calcula movimento do jogador, atualiza adversários a partir do mesmo retrato de tráfego, resolve contatos e verifica progresso/chegada. Física e IA retornam novos dados; somente a simulação aplica esses resultados. `LapTracker` pertence à simulação e mantém os portões ordenados.

O loop em `game.js` lê controles e chama `step()`. Depois sincroniza modelos, HUD e câmeras e renderiza. A IA continua circulando após chegar, com tempo de chegada preservado, até o jogador encerrar a corrida. A pausa e o resultado suspendem os passos da simulação.

Estado de apresentação fica nos respectivos adaptadores: teclas em controles, modo/interpolação em câmeras, garagem em interface, áudio em áudio e meshes em carros. `gridRevision`/`cameraRevision` são sinais de invalidação emitidos pela simulação para recriar modelos ou reposicionar a câmera após comandos/recuperação. Os leitores não alteram esses sinais. Não há estado da aplicação exposto em `window` nem dependências circulares entre módulos.

## Parâmetros e próximos pontos de extensão

Edite `src/config.js`:

- `CARS`: potência, velocidade máxima em m/s, aderência, cores, tipo de carroceria e descrição.
- `TRACK`: pontos do circuito, amostragem, linha de largada, grid do jogador e semente do cenário.
- `PHYSICS`: freio, arrasto, direção, limites fora da pista e colisões.
- `OPPONENTS`: nomes, cores, ritmo, grid, antecipação de curvas, faixas e separação.
- `RACE`: número de voltas, passo fixo, largada e limites do loop.
- `CAMERAS`: distâncias, alturas, campo de visão e amortecimento.

Os valores existentes foram mantidos, inclusive a convenção original de direção confirmada pelo usuário. `config.js` é tratado como dado de leitura durante a execução.

Uma nova pista começa pelos dados de `TRACK`; o cenário costeiro ainda tem posições específicas que devem ser adaptadas em `scenery.js`. Novos formatos de carroceria pertencem a `cars.js`, com os dados em `CARS`. Melhorias de dinâmica pertencem a `physics.js`, sem precisar acessar DOM ou modelos. Não foram acrescentados seletores de pista, novas carrocerias ou recursos nesta etapa.

## Controles preservados

- W / seta para cima: acelerar.
- S / seta para baixo: frear.
- A / seta para esquerda e D / seta para direita: direção no sentido original.
- C: alternar as três câmeras.
- P / Escape: pausar e retomar.
- R: reiniciar durante a corrida.
- Botões de toque em telas estreitas.

Perder foco ou ocultar a aba pausa a corrida e limpa as entradas. Há também botões para câmera, pausa, reinício, som e tela cheia.

## Validação da refatoração

A versão anterior foi executada no Chrome e seus oito testes passaram antes da reorganização. Foram capturados nove registros de referência de movimento, direção, frenagem, tráfego e classificação, incluindo 300 segundos com o jogador parado. Após separar os sistemas, a comparação desses registros encontrou zero diferenças nos valores observados. Isso é uma comparação determinística de cenários específicos, não uma prova de equivalência para toda entrada possível.

Os oito testes atuais verificam projeção e passagem pela origem da pista, largada sem volta falsa, três voltas completas, ré na linha, deslocamentos inválidos/fora da pista, decisões de tráfego, classificação por progresso e ordem de chegada, isolamento dos snapshots, pausa e reinício. A simulação de 300 segundos verifica sete chegadas e distância entre centros maior que 3 m nas amostras por segundo. Outro teste conclui a corrida por comandos de pilotagem programados, sem injetar posições ou voltas, e verifica o congelamento do resultado.

No Chrome local foram exercitados menus, seleção dos três carros, largada, aceleração, comandos A/D, freio, pausa com cronômetro congelado, retomada, reinício e as três câmeras. Uma bancada temporária usou os módulos reais para concluir três voltas por pilotagem programada e renderizar o resultado: 02:07.291, melhor volta 00:41.766, P8. Foram conferidos nova corrida e retorno ao menu. A bancada foi removida; não há piloto automático na aplicação entregue.

Foram verificados imports existentes, carregamento HTTP dos módulos e ausência de ciclos. Three.js e CSS mantiveram seus hashes originais. Não apareceram erros de JavaScript no console nos fluxos exercitados.

## Limitações preservadas e pendências

Esta etapa reorganiza o código, sem correções intencionais de jogabilidade ou mudanças de balanceamento. Ajustar bootstrap, imports e servidor faz parte da conexão da nova estrutura.

A IA segue uma trajetória cinemática e não usa a mesma dinâmica do jogador. Contatos continuam aproximados; não há colisões físicas com prédios, árvores ou barreiras. A recuperação e a validação por quatro portões foram mantidas. O limite de 250 ms por quadro evita recuperação excessiva após uma interrupção, mas não equivale a simular todo o tempo de uma travada longa. Esses comportamentos não foram ampliados ou corrigidos nesta refatoração.

Não foi concluída uma corrida inteira por pilotagem humana. Toque em aparelho físico, qualidade sonora, tela cheia e outros navegadores/GPU não foram validados nesta etapa. Testes de domínio não validam shaders nem som; a inspeção visual no Chrome também não constitui comparação pixel a pixel.
