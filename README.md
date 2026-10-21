# APEX — GT Endurance

Protótipo de corrida GT3 em JavaScript e Three.js r170, com circuito costeiro e visual 3D estilizado. Sem dependências de instalação ou etapa de build. Requer navegador com WebGL 2, Node.js 20+ para o servidor e os testes.

## Executar

```sh
npm start
```

Abra o endereço exibido no terminal (por padrão, http://localhost:8000). Se a porta estiver ocupada, o servidor tenta as próximas até 8009. Encerre-o com Ctrl+C. Não abra `index.html` diretamente por `file://`, pois o jogo usa módulos JavaScript. A fonte remota tem fallback local; o Three.js está incluído no projeto.

## Controles

- W / seta para cima: acelerar.
- S / seta para baixo: frear.
- A / seta para esquerda e D / seta para direita: direção.
- C: alternar as três câmeras.
- P / Escape: pausar e retomar.
- R: reiniciar durante a corrida.
- Botões de toque aparecem em telas estreitas.

Perder o foco ou ocultar a aba pausa a corrida e libera os comandos. A recuperação automática após afastar-se muito da pista retorna à última posição projetada, sem conceder avanço de volta.

## Estabilização

Preservado o sentido original da direção. Corrigidos o grid antes da linha de largada, atualização do progresso após o movimento, contagem de voltas por portões ordenados, entradas presas após pausa, áudio ao silenciar/reiniciar, câmera inicial/reinício e descarte de geometrias, materiais e texturas dos carros substituídos. A física usa passos de 1/120 s, com recuperação de até 250 ms por quadro; interrupções maiores são limitadas para evitar uma sequência excessiva de simulação.

Os adversários verificam tráfego antes de trocar de faixa, reduzem velocidade atrás de carros e mantêm separação entre si, inclusive durante mudanças laterais e ao alcançar retardatários. Seu tempo de chegada fica registrado; continuam circulando até o jogador terminar, sem acumular carros parados na linha. A classificação preserva a ordem de chegada dos adversários que já terminaram.

O carregamento informa falhas de inicialização e a perda do contexto WebGL pausa a corrida. A proposta visual, o circuito, os três GT3 e a corrida de três voltas foram preservados.

## Verificação realizada

```sh
npm test
```

Oito testes automatizados cobrem projeção contínua na pista, passagem pela origem, largada sem volta falsa, três voltas completas, cruzamentos em ré, deslocamentos inválidos/fora da pista, tráfego, controles, freio, pausa, reinício, recuperação, posições finitas das três câmeras, encerramento e física a 30/60/120 quadros por segundo.

A integração executa o código real do jogo com Three.js real, substituindo DOM, áudio e renderizador. Uma simulação de 300 segundos com jogador parado verificou os sete adversários concluindo três voltas, sem distância entre centros inferior a 3 m nas amostras coletadas a cada segundo. Isso não garante ausência de qualquer contato em todas as situações. O teste de chegada do jogador percorre posições programadas na pista; não representa pilotagem humana.

No Chrome local foram verificados carregamento/renderização WebGL, ausência de erros de JavaScript no console nas interações verificadas, seleção dos três carros, largada, aceleração pelo teclado, pausa com cronômetro congelado, retomada, reinício, alternância visual das três câmeras e acionamento do áudio.

Não foi concluída manualmente uma corrida inteira. Toque em aparelho físico, qualidade sonora, tela cheia e navegadores/dispositivos diferentes não foram validados. Os testes de integração não validam shaders, GPU ou áudio.
