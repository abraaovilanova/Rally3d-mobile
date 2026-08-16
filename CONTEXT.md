# Contexto — Rally Mobile

Glossário do domínio. Apenas linguagem — nada de decisões de implementação.

Este é um jogo diferente do Rally 2D, não uma porta dele. Compartilha alguns termos por herança
(Bioma, Volta, Escalada, Etapa, Semente, Tempo, Batida) e descarta o resto: não existem **Ponto de
Mira**, **Acelerador** nem **Zona Morta** aqui.

## Etapa (Stage)

A unidade jogável: a combinação de um **Bioma** e uma **Volta**. Tem **Semente** fixa, guarda um
**Melhor Tempo**, e dura aproximadamente 40 segundos de **Corrida** limpa — curta o bastante para
ser decorada numa sessão só.

## Bioma (Biome)

A identidade visual de uma **Etapa** — paleta — junto com o catálogo base de **Segmentos**.

## Volta (Lap)

Quantas vezes o jogador percorreu o ciclo completo de Biomas. É o que faz a **Escalada** avançar.

## Escalada (Escalation)

O aumento de dificuldade conforme a **Volta** cresce. Aperta exatamente duas coisas: a **Pista**
fica mais estreita, reduzindo a margem da **Posição Lateral**, e a **Janela** de cada **Virada**
fica mais curta. Nunca aperta a antecedência da **Nota** — ver [Nota](#nota-pacenote).

## Corrida (Race)

Uma tentativa única de percorrer a **Pista** de uma **Etapa** até a **Linha de Chegada**. Termina
em **Conclusão** ou **Batida**.

## Pista (Track)

O caminho de uma **Etapa**: uma **Linha Central** curva montada de **Segmentos**, de largura
constante, derivada inteiramente da **Semente**. Comprimento fixo — a distância é igual para todos,
o **Tempo** é o que varia.

## Segmento (Segment)

A peça de que a **Linha Central** é montada. Cada Segmento de curva produz exatamente uma
**Virada**.

## Câmera Invertida (Reverse Camera)

O observador fica à frente do **Carro**, olhando para trás: o jogador vê o Carro vindo em sua
direção e a **Pista** já percorrida se afastando ao fundo. **Não vê nada do que vem pela frente.**

É a decisão que define o jogo. Toda a informação sobre o que está por vir chega por **Nota** ou por
memória — nunca pelos olhos.

## Nota (Pacenote)

O aviso do que vem a seguir: direção e severidade da próxima **Virada**. Chega por **símbolo na
tela** (canal principal, o jogo é inteiramente jogável no mudo) e por **voz** (reforço). A
antecedência é medida em **distância**, não em segundos, para continuar suficiente em qualquer
velocidade.

A Nota é o contrato de justiça do jogo: **avisa de tudo que pode matar o jogador, e de nada mais.**
Ela não distingue as Viradas que têm **Desvio** das que não têm — omitir isso nunca causa uma
**Batida**, só custa **Tempo**.

## Virada (Turn)

O gesto de swipe, para a esquerda ou para a direita, que faz o **Carro** tomar uma curva. Discreta:
acontece num ponto, não é pilotagem contínua. Duas coisas podem dar errado, e elas são diferentes:

- **Direção errada** — o Carro vai para o lado errado e toca a **Borda**: **Batida**.
- **Fora da Janela** — a Virada acontece, mas raspando: o Carro perde velocidade e o **Tempo**
  piora. Não mata.

Decorar a Etapa é o que mantém o jogador vivo; executar no instante certo é o que faz o Tempo.

## Janela (Window)

O intervalo em que uma **Virada** conta como bem executada. Errar a Janela custa velocidade, nunca
a **Corrida**. Encurta com a **Escalada**.

## Posição Lateral (Lateral Position)

Onde o **Carro** está entre as duas **Bordas**, controlada continuamente pela **Inclinação**. Vale
o tempo todo, não só em trechos marcados. É o que desvia dos **Obstáculos** e o que permite passar
por dentro da curva — e portanto uma das duas fontes de **Tempo**.

## Inclinação (Tilt)

Girar o celular no eixo de rolagem, como um volante, para controlar a **Posição Lateral**. Sempre
tem um controle equivalente por toque (arrastar o polegar), porque a permissão de sensor pode ser
negada — o caminho por toque é normal, não um modo reduzido.

## Impulso (Boost)

Toque duplo na tela: aumenta a velocidade do **Carro** por um tempo e depois recarrega. Velocidade
alta encurta o tempo de reação a cada **Nota** e faz a **Borda** chegar antes — o Impulso é uma
aposta, não um bônus.

## Obstáculo (Obstacle)

Objeto na **Pista** que a **Posição Lateral** desvia. Tocá-lo é **Batida**. Toda ocorrência é
anunciada por **Nota** — um Obstáculo que mata sem aviso viola o contrato de justiça.

## Bifurcação (Fork)

Uma **Virada** em que não fazer nada não mata: o **Carro** segue em frente e entra num **Desvio**.
A Bifurcação não é uma escolha entre dois gestos — é a **ausência** de gesto. O jogador não sabe
quais Viradas são Bifurcações até já ter passado por elas.

Não acontece em toda Virada. Nas demais, não virar é **Batida**.

## Desvio (Detour)

O **Caminho** em que o **Carro** cai ao não fazer a **Virada** numa **Bifurcação**. É sempre mais
longo que a **Pista**, é liso (não tem Viradas próprias) e reencontra a Pista adiante. Nunca é um
atalho: seguir reto jamais compensa, senão a **Nota** estaria mentindo.

O Desvio é uma rede de segurança que custa caro, não uma opção a considerar.

## Fora de Rota (Off Route)

O estado de estar num **Desvio**. É **imediatamente visível** — asfalto escuro, aviso na tela — a
partir do instante da entrada. O jogador precisa entender na hora por que o **Tempo** dele piorou;
caso contrário ele culpa os controles.

## Carro (Car)

A entidade controlada pelo jogador. Segue a **Pista** sozinho entre as **Viradas**; o jogador
controla a **Virada** (swipe), a **Posição Lateral** (Inclinação) e o **Impulso** (toque duplo).
Nunca para.

## Borda da Pista (Track Edge)

O limite lateral da **Pista**. Tocá-la é **Batida**.

## Batida (Crash)

Encerra a **Corrida** sem produzir **Tempo**, incrementa as **Tentativas** e devolve o jogador ao
início da mesma **Etapa**. Nunca faz retroceder na **Progressão**. Vem de três coisas, todas
previsíveis pela **Nota** ou pela memória: tocar a **Borda**, virar para o lado errado, tocar um
**Obstáculo**.

## Conclusão (Finish)

O **Carro** cruzou a **Linha de Chegada** sem bater. Única forma de produzir um **Tempo** e de
avançar na **Progressão**.

## Tempo (Time)

A duração de uma **Corrida** concluída. Varia por duas coisas, e só por elas: a precisão das
**Viradas** dentro da **Janela**, e a **Posição Lateral** ao longo das curvas. Uma **Batida** não
produz um Tempo ruim — não produz Tempo nenhum.

## Melhor Tempo (Best Time)

O menor **Tempo** registrado para uma **Etapa**. Pertence à Etapa; comparar Melhores Tempos de
Etapas diferentes não significa nada.

## Tentativa (Attempt)

Sinônimo de **Corrida**, usado ao contá-las. O contador pertence à **Etapa** atual e zera ao
avançar.
