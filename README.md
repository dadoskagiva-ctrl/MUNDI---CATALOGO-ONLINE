# Mundi TKR Sports — Repositório pronto para GitHub + Render + base Neon

Este pacote mantém **todo o conteúdo original** do projeto e adiciona a estrutura mínima para publicação no **GitHub**, deploy no **Render** e preparação de banco no **Neon**.

## O que existe hoje
O projeto atual é um **site estático** (`index.html` + `imgs/`) e os dados administrativos são persistidos no navegador com `localStorage` / `sessionStorage`.

Isso significa:
- **GitHub:** pronto para subir.
- **Render:** pronto para deploy como **Static Site**.
- **Neon:** incluído como **base pronta** (`neon/schema.sql` e `.env.example`) para a próxima etapa de migração do armazenamento local para banco.

## Estrutura
```text
.
├── index.html
├── imgs/
├── README.md
├── .gitignore
├── render.yaml
├── .env.example
└── neon/
    └── schema.sql
```

## Subir no GitHub
1. Crie um repositório novo no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Commit sugerido:
   ```bash
   git init
   git add .
   git commit -m "feat: initial deploy-ready project"
   git branch -M main
   git remote add origin SEU_REPOSITORIO.git
   git push -u origin main
   ```

## Deploy no Render
### Opção 1 — usando `render.yaml`
1. No Render, escolha **New +** → **Blueprint**.
2. Conecte o repositório do GitHub.
3. O Render lerá o arquivo `render.yaml` automaticamente.

### Opção 2 — manual
Crie um **Static Site** com:
- **Publish Directory:** `.`
- **Build Command:** *(vazio)*

## Neon
A pasta `neon/` já contém um `schema.sql` inicial baseado nas entidades do sistema atual:
- representantes
- vídeos
- logs
- downloads
- links gerais
- links por produto

### Criar banco
1. Crie um projeto no Neon.
2. Abra o SQL Editor.
3. Rode o conteúdo de `neon/schema.sql`.

### Variáveis de ambiente
Copie `.env.example` para `.env` quando houver backend:
```bash
cp .env.example .env
```

## Observação importante
O site **continua funcionando exatamente como veio**.  
A integração real com Neon ainda exigirá uma próxima etapa: criar um backend/API e trocar o uso de `localStorage` por chamadas ao banco.

## Login Admin atual
- Usuário: `admin`
- Senha: `Admin@2026`
