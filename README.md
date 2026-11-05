# Kurio — marketplace de NFTs

Aplicação frontend do desafio, com telas responsivas, API simulada por MSW e fluxos de catálogo, conta, carrinho e compra.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Executar localmente

```powershell
npm.cmd install
npm.cmd run dev
```

Abra a URL exibida pelo Vite (normalmente `http://localhost:5173`). Os mocks são ativados por padrão; não é necessário backend nem arquivo `.env`.

Comandos adicionais:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run preview
npm.cmd run typecheck:test
npm.cmd run test:unit
npm.cmd run test:e2e
```

Na primeira execução E2E, instale Chromium com
`npx.cmd playwright install chromium`. Playwright inicia o Vite com MSW; os testes
reiniciam os dados simulados antes de cada cenário. Relatórios HTML, traces e
capturas de falha são gravados em pastas ignoradas pelo Git.

Testes unitários cobrem aritmética ETH, mocks, handlers REST, adaptadores Axios,
casos de uso e utilitários de apresentação. Os E2E estão separados por jornada
em `tests/e2e/`; baselines cobrem início, detalhe, carrinho e pagamento em
desktop e mobile.

## Arquitetura e estilos

- `src/domain/`: entidades, contratos de domínio e regras puras, como aritmética ETH.
- `src/application/`: portas dos repositórios e casos de uso independentes de transporte.
- `src/infrastructure/`: adaptador Axios, mocks MSW/Socket.IO e persistência de demonstração.
- `src/app/`: composição das dependências e rotas.
- `src/presentation/features/`: páginas e componentes organizados por fluxo/tela.
- Cada funcionalidade de apresentação mantém seus estilos CSS em uma pasta
  `presentation-*-styles` ao lado das páginas e componentes. Os estilos globais
  ficam em `src/presentation/presentation-global-styles/`.
- `components.json` registra os aliases shadcn/ui para os componentes de UI
  adaptados ao tema. O projeto usa primitives Radix, CVA e Tailwind Merge.
- Testes unitários ficam próximos do código testado, em pastas `*-tests`
  específicas da camada ou funcionalidade. `tests/e2e/` separa os fluxos por
  jornada (`account/`, `authentication/`, `cart/`, `catalog/`, `checkout/`,
  `favorites/` e `realtime/`); `visual/` contém os cenários visuais e
  `visual-baselines/` suas referências desktop/mobile.
- Componentes de apresentação importam folhas da pasta de estilos da própria
  funcionalidade. Tailwind continua disponível para utilitários e componentes.
- `scripts/check-line-length.mjs`: faz o `lint` falhar se uma linha de código ultrapassar
  100 caracteres. `npm.cmd run format` aplica Prettier; `npm.cmd run format:check`
  confere a formatação sem alterar arquivos.

Fluxo de dependência: apresentação → casos de uso/portas → domínio. Os adaptadores de
infraestrutura implementam as portas e são conectados no composition root em
`src/app/container.ts`; o domínio não importa React, Axios ou MSW.

## Credenciais de demonstração

- `lucas@kurio.test` / `Kurio123!`
- `aether@kurio.test` / `Kurio123!`

## Integração contínua

O workflow `.github/workflows/ci.yml` executa lint, formatação, typecheck,
testes unitários, build e jornadas E2E em pushes e pull requests. Os testes
Playwright e unitários também podem ser executados localmente pelos comandos
acima. Instale o Chromium na primeira execução E2E com
`npx.cmd playwright install chromium`.

## Auditoria Lighthouse

Após instalar Chromium e dependências, execute:

```powershell
npm.cmd run audit:lighthouse
```

O comando gera um build de produção, inicia o preview local e coleta três
medições mobile e desktop para início e detalhe do NFT. Os relatórios HTML/JSON
e as medianas (incluindo LCP, CLS e TBT) são gravados em `lighthouse-reports/`.
As medições ainda precisam ser executadas e revisadas antes da entrega.

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos REST, sessão,
cache, Socket.IO e decisões/limitações da simulação.
