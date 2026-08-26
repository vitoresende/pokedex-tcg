# 🔴 Pokédex TCG Master — Gestão de Acervo, Decks & gRPC Hub

Uma aplicação web moderna, performática e responsiva inspirada no design autêntico de uma **Pokédex**, desenvolvida com **React 18**, **TypeScript**, **Tailwind CSS**, **Connect RPC (gRPC Moderno)** e **Firebase (Auth, Firestore, Storage & Hosting)**.

A aplicação foi projetada especificamente para gerenciar o acervo de cartas Pokémon TCG (279 cartas consolidadas a partir do CSV), visualizar e planejar estratégias dos 5 baralhos mapeados, consultar as regras e tipos de cartas de forma visual (sem imagens estáticas de baixa qualidade, mas em HTML/CSS interativo) e servir como um **Hub Educacional de Alta Fidelidade sobre gRPC e Connect RPC**.

---

## ⚡ Principais Funcionalidades

### 1. 📱 Pokédex & Catálogo Interativo de Cartas
- **279 Cartas do Acervo Integradas**: Todas as cartas consolidadas com fotos em alta definição, número da edição, qualidade (*Near Mint*, etc.), raridade, idioma e comentários.
- **Efeito Holográfico 3D (Holo/Foil)**: Efeito de inclinação perspectiva 3D realista e reflexo arco-íris brilhante para cartas holográficas ao passar o mouse ou tocar na tela.
- **Filtros e Busca Instantânea**: Busca por nome (PT/EN), número (#), coleção (CRI, HIF, UNM, BUS, TEU, etc.), raridade, e filtros rápidos por tipos elementais (Planta, Fogo, Água, Raios, Psíquica, Luta, Escuridão, Metal, Fada, Dragão, Incolor, Treinador, Energia).
- **Controle de Quantidade & Notas**: Modifique quantidades owned (+/-), adicione aos favoritos e registre anotações táticas por carta.

### 2. 🎴 Estratégias & Gestão dos 5 Baralhos (Decks)
- **Visualizador dos 5 Decks**:
  1. **Darkness Beatdown & Tag Team Rush** *(Expandido / Aggro Toolbox GX - 60 cartas)*
  2. **Charizard Turbo & Beatdown** *(Expandido / OHKO Pesado - 60 cartas)*
  3. **Dragon Lock & Item Denial** *(Expandido / Controle de Mão e Trava - 60 cartas)*
  4. **Poison Trap & Metal Fortress** *(Casual / Status e Muralha - 60 cartas)*
  5. **Fairy Swarm & Healing Guard** *(Casual / Aceleração e Proteção - 60 cartas)*
- **Manual de Pilotagem Turno a Turno**: Guias passo a passo para *Abertura (Turnos 1 e 2)*, *Meio de Jogo (Turnos 3 a 5)* e *Fechamento (Late Game)*.
- **Rastreador de Energias Faltantes**: Notificação clara das energias e cartas necessárias para completar a lista física (ex: `+17 Fogo Básica`, `+2 Psíquica`, `+1 Metal`, etc.).
- **Exportação para Pokémon TCG Live**: Cópia instantânea da lista formatada para a área de transferência com um clique.

### 3. 📖 Guia Visual de Regras & 11 Tipos Elementais (HTML/CSS Puro)
- **11 Tipos Elementais**: Recriados em componentes modernos HTML/CSS/Tailwind com as descrições oficiais, ícones temáticos, vantagens táticas e fraquezas (Planta, Fogo, Água, Raios, Psíquica, Luta, Escuridão, Metal, Fada, Dragão e Incolor).
- **Tipos de Treinador**: Diferenciação clara entre Itens (sem limite por turno), Apoiadores (1 por turno), Estádios e Ferramentas Pokémon.
- **Formatos do Jogo**: Comparativo entre *Standard (Padrão)*, *Expanded (Expandido)* e *Casual (Mesa de Casa)*.
- **Condições Especiais Interativas**: Explicações dinâmicas sobre Envenenado, Queimado, Confuso, Paralisado e Adormecido com orientações de cura.

### 4. ⚡ Hub de Aprendizado gRPC & Connect RPC
- **Guia Arquitetural Completo**: Explicação direta de conceitos, histórico do gRPC em navegadores, o problema dos *Trailers* HTTP/2 e a solução inovadora do *Connect RPC* sem necessidade de Envoy Proxy.
- **Playground Interativo com Wire Size Inspector**: Dispare chamadas RPC reais e simuladas, alterne entre **Protobuf Binário** e **JSON Textual**, e veja a redução em tempo real de até **70% no tamanho dos payloads** transmitidos.
- **Inspetor de Cabeçalhos e Interceptors**: Demonstração de passagem de tokens Bearer do Firebase Auth via interceptores gRPC.

### 5. 🔒 Autenticação Firebase com Whitelist de E-mails (.env)
- **Login via Google OAuth (Gmail)**.
- **Validação de Whitelist**: Apenas os e-mails informados na variável `VITE_ALLOWED_EMAILS` do arquivo `.env` recebem permissão para sincronizar coleções no Cloud Firestore. Usuários não autorizados são avisados com uma interface de bloqueio amigável e navegam em modo de visitante seguro.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18.3+, TypeScript 5.6+, Vite 5.4+
- **Estilização**: Tailwind CSS 3.4+, Lucide React (Ícones)
- **RPC & Protocol Buffers**: `@connectrpc/connect`, `@connectrpc/connect-web`, `@bufbuild/protobuf`
- **Áudio**: Web Audio API (Sintetizador nativo sem arquivos de áudio pesados)
- **Backend Serverless**: Firebase Cloud Functions (2nd Gen), `@connectrpc/connect-express`, Express
- **Banco de Dados & Armazenamento**: Cloud Firestore, Firebase Storage
- **Hospedagem**: Firebase Hosting

> [!NOTE]
> **Compatibilidade Total de Dependências**: O projeto foi configurado com bibliotecas modernas e resolvidas. A instalação via `npm install` ou `yarn install` roda diretamente **sem necessidade de `--legacy-peer-deps` ou `--legacy-deps`**.

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js 20+ (ou 18+)
- npm 10+ ou Yarn 1.22+

### Passo a Passo

1. **Clone o repositório e acesse a pasta:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd pokedex-tcg
   ```

2. **Carregue a versão do Node via NVM (opcional):**
   ```bash
   nvm use
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

4. **Configure as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` com suas credenciais do Firebase e adicione os e-mails autorizados para login:
   ```env
   # Firebase Config
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

   # Lista de e-mails permitidos (separados por vírgula)
   VITE_ALLOWED_EMAILS=vitoresende.dev@gmail.com,seu-email@gmail.com

   # Endpoint do Connect-RPC (Cloud Functions)
   VITE_CONNECT_RPC_URL=https://southamerica-east1-seu-projeto.cloudfunctions.net/api
   ```

4. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   Acesse no navegador: `http://localhost:3000`

5. **Gere a Build de Produção:**
   ```bash
   npm run build
   # ou
   yarn build
   ```

---

## 🖼️ Gerenciamento de Imagens das Cartas & Firebase Storage

Todas as 279 cartas do acervo contam com download automatizado e imagens salvas localmente em `public/cards/`.

### 1. Script de Download de Imagens
Caso queira atualizar ou baixar novamente as imagens da internet (com fallback automático entre CDNs de alta resolução e Limitless TCG em português):
```bash
npm run download:cards
# ou
python3 scripts/download_images.py
```

### 2. Upload para o Firebase Storage
Para enviar as imagens locais em lote para o seu bucket do Firebase Storage:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Vá em **Configurações do Projeto > Contas de Serviço > Gerar nova chave privada**.
3. Salve o arquivo JSON baixado com o nome `serviceAccountKey.json` na raiz do projeto (o arquivo já está protegido no `.gitignore`).
4. Execute o script de upload informando seu bucket:
   ```bash
   npm run upload:firebase seu-projeto.appspot.com
   # ou
   node scripts/upload_to_firebase.js seu-projeto.appspot.com
   ```

---

## 📚 Guia gRPC: O Que Você Precisa Saber

### 1. O que é gRPC e Protocol Buffers?
O **gRPC** (Google Remote Procedure Call) é um framework de comunicação síncrona e assíncrona de alto desempenho. Em vez de endpoints REST baseados em strings JSON e verbos HTTP tradicionais, o gRPC utiliza:
- **Protocol Buffers (Protobuf v3)**: Uma linguagem de definição de interface (IDL) onde mensagens e serviços são descritos em arquivos `.proto`.
- **Serialização Binária**: Mensagens são codificadas em formato binário compacto, reduzindo o tráfego de rede em até 70% comparado a JSON.
- **Tipagem Estrita**: Geração automatizada de clientes e servidores fortemente tipados em TypeScript, Go, Python, Java, etc.

### 2. O Problema Histórico do gRPC no Navegador
Navegadores web não permitem que o JavaScript (via `fetch` ou `XMLHttpRequest`) controle frames HTTP/2 de baixo nível nem processe **HTTP Trailers** (usados pelo gRPC para retornar o status final da RPC).
Por anos, a única alternativa era usar o **gRPC-Web**, que exigia configurar e hospedar servidores proxy dedicados como o **Envoy Proxy** apenas para intermediar as requisições dos navegadores.

### 3. A Solução: Connect RPC (Buf)
O **Connect RPC** é uma especificação moderna mantida pela equipe da Buf que suporta 3 protocolos em um único endpoint:
1. **gRPC Nativo** (HTTP/2 puro)
2. **gRPC-Web** (Compatível com proxies existentes)
3. **Connect Protocol** (Funciona nativamente sobre HTTP/1.1 e HTTP/2 usando POST padrão com JSON ou Protobuf binário).

**Vantagem Crítica no Firebase**: Com Connect RPC, podemos rodar o backend diretamente no **Firebase Cloud Functions (2nd Gen)** ou **Google Cloud Run** sem nenhum proxy Envoy, usufruindo de escala a zero e custo reduzido.

### 4. Matriz Comparativa: gRPC vs REST vs GraphQL

| Dimensão | REST Tradicional (JSON) | Connect RPC / gRPC Moderno | GraphQL |
| :--- | :--- | :--- | :--- |
| **Segurança de Tipos** | Manual ou OpenAPI (propenso a drift) | **100% Garantida em compilação (.proto)** | Boa via schema/codegen |
| **Tamanho do Payload** | Textual (chaves repetidas a cada item) | **Binário Protobuf (até 70% menor)** | Textual (campos customizados) |
| **Complexidade de Infra** | Simples | **Simples (Zero Proxy no Connect RPC)** | Média/Alta (resolvers, N+1) |
| **Streaming** | SSE / WebSockets separados | **Nativo (Server/Client Streaming)** | Subscriptions via WebSockets |
| **Velocidade de Deserialização** | Lenta (Parser JSON textual) | **Ultrarrápida (Decodificação binária)** | Lenta (Parser JSON textual) |

---

## ☁️ Deploy no Firebase

O projeto já inclui todos os arquivos de configuração necessários:
- `firebase.json` (Regras de Hosting, Cloud Functions 2nd Gen e rewrites)
- `.firebaserc` (Identificador do projeto Firebase)
- `firestore.rules` (Regras de segurança de leitura pública e escrita autenticada)
- `storage.rules` (Regras de armazenamento de imagens)

### Como Fazer o Deploy:

1. **Instale o Firebase CLI (se ainda não possuir):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Faça login no Firebase:**
   ```bash
   firebase login
   ```

3. **Selecione o seu projeto:**
   ```bash
   firebase use seu-projeto-firebase
   ```

4. **Compile a aplicação e execute o deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## 📂 Estrutura do Projeto

```
pokedex-tcg/
├── public/
│   ├── cards/                  # Imagens locais das 279 cartas baixadas
│   └── favicon.svg             # Ícone Pokédex
├── proto/                      # Contratos Protocol Buffers v3
│   ├── pokedex/v1/pokedex.proto
│   └── user/v1/user.proto
├── scripts/
│   ├── download_images.py      # Script Python multithread de download de cartas
│   ├── upload_to_firebase.js   # Script Node.js para upload no Firebase Storage
│   └── generate_data.py        # Parser e enriquecedor de dados do CSV e Markdown
├── functions/                  # Backend Serverless Firebase Functions 2nd Gen
│   ├── src/index.ts            # Implementação Connect RPC Express + Firestore
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/             # Componentes de UI (HoloCard, PokedexHeader, FilterBar, etc.)
│   ├── context/                # Contextos globais (AuthContext com Whitelist, CollectionContext)
│   ├── data/                   # JSONs gerados (cards.json, decks.json, rules.json, types_info.json)
│   ├── pages/                  # Páginas principais (Pokédex, Decks, Regras & Tipos, gRPC Hub, Perfil)
│   ├── services/               # Serviços (Firebase, Connect-RPC, Áudio Sintetizado)
│   ├── types/                  # Tipagens TypeScript completas
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example                # Template de variáveis de ambiente
├── firebase.json               # Configurações de Deploy Firebase
├── firestore.rules             # Regras de Segurança do Firestore
├── storage.rules               # Regras de Segurança do Storage
├── tailwind.config.js          # Tema Pokédex customizado
└── vite.config.ts              # Configuração Vite com Code Splitting
```

---

## 📄 Licença

Desenvolvido para fins educacionais e de gestão de coleção Pokémon TCG. Todos os direitos de nomes e imagens pertencem à The Pokémon Company / Nintendo / Creatures Inc. / GAME FREAK inc.
