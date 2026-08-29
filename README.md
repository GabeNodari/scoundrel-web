# Scoundrel Web 🃏

Uma adaptação web do jogo solo de cartas Scoundrel.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
<br>
![Status](https://img.shields.io/badge/status-jogo%20funcional-brightgreen)

## Visão Geral

Scoundrel Web é uma implementação digital do sistema de regras do jogo Scoundrel, pensado para rodar diretamente no navegador sem backend. O jogador enfrenta um calabouço formado por um baralho de 44 cartas, resolve salas estratégicas, escolhe a ordem correta de ataque, cura e equipamento e procura sobreviver até o fim da campanha.

O projeto foi pensado como uma experiência completa, com interface responsiva, ilustrações vetoriais em SVG, indicador D20 de vida, painel de status, log de ações e tela de fim de partida com pontuação e estatísticas.

> Este projeto foi desenvolvido com abordagem spec-driven, com a arquitetura e as regras do jogo documentadas e validadas em conjunto com apoio de IA para implementação, refinamento e revisão do código.

## Objetivo

- Reproduzir as regras do jogo solo Scoundrel em ambiente web.
- Oferecer uma interface clara e moderna para jogar diretamente no navegador.
- Garantir que a lógica do jogo siga as regras do sistema original com testes automatizados.
- Entregar uma experiência visual coesa com dark fantasy, SVGs customizados e feedback imediato no turno.

## Funcionalidades

- Baralho de 44 cartas com monstros, armas e poções.
- Sistema de salas, escolha de cartas e resolução em ordem tática.
- Cura por poções com limite de uma por sala.
- Armas com dano reduzido e desgaste progressivo.
- Bloqueio de fuga em salas consecutivas.
- Carry-over de cartas para a próxima sala.
- Indicador de vida em formato D20 com estados visuais dinâmicos.
- Painel de arma equipada e desgaste.
- Log de ações em tempo real.
- Modal de regras e tela de fim de jogo.
- Testes automatizados cobrindo as regras centrais do jogo.

## Requisitos

- Windows, macOS ou Linux.
- Navegador moderno com suporte a ES Modules.
- Node.js 18+ para rodar os testes.
- Python 3 para servir o projeto localmente.

## Estrutura do Projeto

```text
scoundrel-web/
├── AGENTS.md
├── README.md
├── favicon.svg
├── index.html
├── package.json
├── styles.css
└── src/
    ├── game.js
    ├── game.test.js
    └── main.js
```

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/scoundrel-web.git
cd scoundrel-web
```

2. Instale as dependências do projeto:

```bash
npm install
```

3. Caso queira, utilize o servidor local do projeto:

```bash
npm start
```

## Como Executar

Para abrir o jogo no navegador, execute:

```bash
npm start
```

Em seguida, abra:

```text
http://localhost:8000
```

Se preferir, também é possível servir a pasta manualmente com Python:

```bash
python -m http.server 8000
```

## Como Jogar

1. O jogo revela uma sala com cartas na mesa.
2. O jogador escolhe a sequência de cartas a resolver.
3. A 4ª carta fica como carry-over para a próxima sala.
4. O objetivo é eliminar monstros, usar armas com inteligência e curar quando necessário.
5. Se a vida chegar a zero, a partida termina em derrota.
6. Se o baralho for resolvido com HP maior que zero, o jogador vence.

## Regras Implementadas

- O baralho contém 44 cartas, compostas por monstros, armas e poções.
- Monstros de paus e espadas vão de 2 a 14.
- Armas são representadas por ouros de 2 a 10.
- Poções são representadas por copas de 2 a 10.
- A primeira poção da sala restaura HP, mas as seguintes têm efeito nulo.
- Armas reduzem o dano do monstro: `max(0, monstro - arma)`.
- Quando uma arma derrota um monstro, ela sofre desgaste e passa a exigir monstros menores para continuar sendo eficiente.
- Fugir da sala coloca as cartas no fundo do baralho, sem embaralhar.
- Não é permitido fugir em duas salas consecutivas.
- A pontuação final depende do HP restante ou da soma dos monstros restantes em caso de derrota.

## Testes

O projeto inclui testes automatizados para validar as regras principais do jogo. Para rodar a suíte:

```bash
npm test
```

## Tech Stack

- HTML5 semântico
- CSS 
- JavaScript ES Modules
- SVG para ilustrações e ícones
- Node Test Runner para testes automatizados