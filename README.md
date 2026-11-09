# TAFEL — Plataforma multi-restaurante de menu digital e pedidos por QR Code
MVP funcional em **Next.js 14 + TypeScript + Tailwind + Supabase (Postgres/Auth/Realtime/Storage)**.

## O que já está implementado

**Restaurante**
- Registo/login, criação automática do restaurante na conta
- Onboarding em 4 passos (perfil → menu → mesas → pronto)
- Gestão de categorias e produtos (descrição, preço, **upload de fotografia**, disponibilidade)
- Grupos de opções/extras flexíveis por produto (ex: "Extras", "Ponto da carne")
- Gestão de mesas com geração de QR Codes individuais e download em lote (.zip)
- Painel de pedidos em tempo real (Supabase Realtime), com alerta sonoro e fluxo de estados
- Definições do restaurante (branding, morada, contactos)

**Cliente** (`/r/[slug]/t/[token]`)
- Sem instalação, sem conta, sem email/telefone obrigatórios
- QR Code identifica automaticamente restaurante + mesa
- Menu mobile-first, carrinho local, seleção de extras
- Checkout com confirmação de mesa
- Acompanhamento do estado do pedido via token de sessão (sem login)

**Encomendas para entrega** (`/encomendas/[slug]`) — separado do sistema de Pedidos de mesa
- Link público próprio, independente dos QR Codes, para partilhar em Instagram/WhatsApp/bio
- Reutiliza o mesmo menu/produtos já configurados, sem duplicar dados
- Checkout com nome, telemóvel, morada, código postal e localidade; pagamento no ato da entrega (MB WAY ou dinheiro)
- 6 fases: Pedido recebido → Restaurante aceitou → Em preparação → Pronto → Saiu para entrega → Entregue
- Aba "Encomendas" própria no dashboard (tabela `delivery_orders`, distinta de `orders`), com o mesmo padrão de tempo real
- Acompanhamento do cliente por polling autenticado por token de sessão, tal como os pedidos de mesa

**Plataforma**
- Multi-tenant com isolamento garantido por Row Level Security (RLS) no Postgres
- Badge "+N" nas abas "Pedidos" e "Encomendas" do dashboard, com a contagem em tempo real dos que ainda não foram aceites
- Painel de administração global (`/admin`): listar, bloquear/desbloquear restaurantes, métricas básicas
- Modelo de dados preparado para planos (free/pro/premium) e subscrições futuras

**Ainda não implementado (fora do MVP, mas a arquitetura já prevê):**
- Pagamentos online (MB WAY, cartão, Apple/Google Pay)
- Notificações push nativas (a base está pronta: Realtime + Service Worker pode ser adicionado)
- Faturação/subscrições automáticas (tabela `subscriptions` já existe)

---

## 1. Criar o projeto Supabase

1. Cria um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, corre o ficheiro `supabase/schema.sql` deste projeto — cria todas as tabelas, funções e políticas RLS.
3. Em **Project Settings → API**, copia:
   - `Project URL`
   - `anon public key`
   - `service_role key` (nunca expor no frontend)

## 2. Configurar variáveis de ambiente

Copia `.env.example` para `.env.local` e preenche:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Instalar e correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 4. Criar a tua conta e testar o fluxo completo

1. Vai a `/signup`, cria uma conta — isto cria automaticamente o teu restaurante.
2. Segue o onboarding: adiciona uma categoria, um produto e uma mesa.
3. Abre o QR Code gerado (ou vai diretamente a `/r/teu-slug/t/TOKEN_DA_MESA`) numa aba anónima — é a experiência do cliente.
4. Faz um pedido de teste.
5. Volta ao `/dashboard` — o pedido deve aparecer em tempo real, com som.

## 5. Tornares-te administrador da plataforma (opcional)

No SQL Editor do Supabase, com o teu `user_id` (Authentication → Users):

```sql
insert into platform_admins (user_id) values ('o-teu-user-id-aqui');
```

Depois acede a `/admin`.

## 6. Deploy

- **Frontend/API**: [Vercel](https://vercel.com) — importa o repositório, define as mesmas variáveis de ambiente.
- **Base de dados**: mantém-se no Supabase (já está pronta para produção).
- Atualiza `NEXT_PUBLIC_SITE_URL` para o domínio final (os QR Codes usam esta URL).

---

## Arquitetura — decisões-chave

- **Multi-tenant com RLS**: todas as tabelas têm `restaurant_id`, e o Postgres aplica o isolamento diretamente nas políticas — mesmo um bug no frontend não consegue expor dados de outro restaurante.
- **Cliente sem conta**: o carrinho vive em `localStorage`; o pedido usa um `session_token` aleatório gerado pela base de dados, devolvido ao cliente e usado só para consultar o estado do seu próprio pedido (via API com service role, nunca por RLS direto).
- **Preços validados no servidor**: `/api/orders` recalcula o total a partir da base de dados, ignorando qualquer preço vindo do browser — evita manipulação do carrinho.
- **Realtime só para staff**: as políticas RLS só deixam a equipa do restaurante subscrever a tabela `orders`; o cliente acompanha o pedido por polling a cada poucos segundos via API.
- **QR por mesa**: cada mesa tem um `qr_token` aleatório e opaco — não é possível adivinhar QR Codes de outro restaurante ou mesa.

## Próximos passos sugeridos

1. Upload de imagens direto (Supabase Storage) em vez de URLs manuais no formulário de produto.
2. Notificações push reais (Web Push) para o dashboard, além do som.
3. Stripe/MB WAY para pagamento online, aproveitando a tabela `subscriptions` já existente.
4. Testes automáticos de isolamento RLS (garantir que o restaurante A nunca lê dados do B).
