# dep-agent

Agente de manutenção de dependências para este repositório.

Corre semanalmente como GitHub Action, analisa as dependências npm
de `client/` e `server/`, pede ao Claude um juízo de risco sobre cada
atualização e abre um Pull Request com as propostas. Nunca faz merge
nem deploy: apenas sugere, para revisão humana.

## Estado

Em construção, um passo de cada vez. Primeiro ecossistema: npm.
Desenhado para ser extensível a outros (pip, composer, NuGet, Maven).

## Segurança

- A chave da API vive nos Secrets do GitHub (`ANTHROPIC_API_KEY`),
  nunca no código.
- O Claude recebe informação e devolve juízo/texto; não executa comandos.
- Modo "sugere e espera": abre PR contra `master`, sem merge automático.

## Execução local (testes)

    cd tools/dep-agent
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env   # preenche a chave para testes locais
    python -m dep_agent.main