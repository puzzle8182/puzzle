# Plataforma HealthTech de Acesso à Psicoterapia

Plataforma B2B2C que conecta três atores em um ecossistema de acesso à
psicoterapia: **empresas** (financiam o benefício), **colaboradores**
(escolhem livremente seu psicólogo e usam o benefício) e **psicólogos**
(profissionais independentes, pagam mensalidade para acessar a
infraestrutura da plataforma).

## Princípios de design que guiam o projeto

- **Separação física de dados clínicos e corporativos.** A empresa financia
  o benefício, mas nunca acessa conteúdo clínico — isso é garantido a nível
  de banco de dados (schemas separados + Row Level Security), não apenas
  por regra de negócio na aplicação.
- **Autonomia do psicólogo.** A IA (quando implementada) organiza e
  estrutura informação; quem interpreta e decide é sempre o profissional.
- **Dois fluxos financeiros distintos e independentes:**
  1. Sessão: empresa e/ou colaborador → psicólogo (rateio conforme a
     modalidade de financiamento contratada pela empresa: integral ou
     coparticipação).
  2. Assinatura mensal: psicólogo → plataforma (R$ 150/mês, dá acesso à
     rede e às ferramentas profissionais).
- **Indicadores da empresa são sempre agregados e anônimos**, com um
  limite mínimo de grupo (5 colaboradores) embutido na própria consulta
  SQL — não apenas como boa prática de frontend.

## Stack técnica

- **Backend/banco:** Supabase (PostgreSQL, região São Paulo), com RLS como
  camada primária de segurança
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Autenticação:** Supabase Auth (`@supabase/ssr`), com 4 papéis:
  `empresa_admin`, `colaborador`, `psicologo`, `admin_plataforma`

## Estrutura do banco de dados

Três schemas segregam fisicamente o que é corporativo do que é clínico:

- **`corporate`** — empresas, contratos, colaboradores elegíveis, faturas.
  Tudo que a empresa pode enxergar (dado administrativo/financeiro).
- **`clinical`** — psicólogos, prontuário (notas de sessão), objetivos
  terapêuticos. **Nenhuma policy de RLS dá acesso a `empresa_admin` aqui.**
- **`core`** — agendamentos e os dois fluxos financeiros (sessão e
  assinatura). Não é clínico, mas também não pertence só à empresa.

A única porta de acesso da empresa a qualquer dado derivado de sessão é a
função `corporate.get_indicadores_empresa()`, que embute a proteção de
grupo mínimo diretamente na consulta SQL.

Operações que envolvem múltiplas tabelas ou regras de negócio sensíveis
(criar empresa, adicionar colaborador por e-mail) são encapsuladas em
funções `security definer` (ex: `corporate.criar_empresa()`,
`corporate.adicionar_colaborador_por_email()`) em vez de policies de
INSERT diretas — isso evita espalhar lógica de negócio pela RLS e permite
consultar `auth.users` (normalmente inacessível ao cliente) de forma
controlada.

## Estado atual (testado de ponta a ponta)

✅ Schema completo aplicado via migrations versionadas (`supabase/migrations/`)
✅ Autenticação funcionando para os 3 papéis de usuário final
✅ Layout com sidebar adaptável por papel
✅ Cadastro/login/logout
✅ Psicólogo: formulário de perfil profissional (CRP, abordagem, bio, áreas
  de atuação, valor da sessão)
✅ Colaborador: busca de psicólogos, agendamento de sessão com cálculo
  automático do rateio financeiro, lista de agendamentos
✅ Empresa: cadastro da própria empresa (nome, CNPJ, modalidade de
  financiamento), gestão de colaboradores elegíveis (adicionar por e-mail,
  listar com status)

### Bugs reais encontrados e corrigidos durante o desenvolvimento

Vale documentar porque são armadilhas comuns de RLS no Postgres/Supabase:

1. **Recursão infinita em policy:** uma policy de `SELECT` em `profiles`
   fazia um subquery na própria tabela `profiles` — o Postgres detecta
   isso como recursão e nega a consulta. Corrigido usando uma função
   `security definer` (`is_admin_plataforma()`) em vez do subquery inline.
2. **Grants ausentes:** RLS só é avaliada *depois* que o Postgres confirma
   que o role tem permissão básica (`GRANT`) na tabela. Schemas
   customizados (`corporate`, `clinical`, `core`) não vêm com esse grant
   por padrão como o schema `public` do Supabase — precisou de
   `GRANT ... TO authenticated` explícito em todas as tabelas.
3. **View de busca pública com `security_invoker = true`:** isso fazia a
   view herdar a RLS da tabela por trás (`clinical.psicologos`, que só
   permite cada psicólogo ver o próprio registro), deixando a busca
   sempre vazia para qualquer colaborador. Corrigido removendo essa opção.
4. **Perfis de colaboradores invisíveis para o RH:** a policy original de
   `profiles` só permitia ver o próprio registro (ou admin da plataforma),
   então a tela de gestão de colaboradores não conseguia mostrar nome/
   e-mail de ninguém. Corrigido com uma policy adicional que libera a
   visualização quando existe vínculo de colaborador elegível na mesma
   empresa do admin que está consultando.

## O que ainda falta (gaps conhecidos)

- **Cobrança/billing:** a mensalidade do psicólogo (R$ 150) e o pagamento
  da sessão ainda não têm Edge Functions de integração com gateway de
  pagamento. Hoje a ativação da assinatura (`status_assinatura = 'ativa'`)
  precisa ser feita manualmente.
- **Confirmação de e-mail:** desativada temporariamente nas configurações
  do Supabase para agilizar testes — **reativar antes de qualquer uso
  real**, e configurar um provedor de e-mail transacional (o padrão do
  Supabase é só para testes, com limite de envio baixo).
- **Prontuário clínico:** o registro de notas de sessão
  (`clinical.notas_sessao`) e objetivos terapêuticos existe no banco, mas
  ainda não tem interface no frontend.
- **Disponibilidade de horário do psicólogo:** o agendamento hoje aceita
  qualquer data/hora digitada pelo colaborador, sem checar a
  disponibilidade real cadastrada pelo psicólogo (`disponibilidade` jsonb
  existe na tabela, mas não é usado ainda).
- **Auditoria de leitura de prontuário:** existe uma função
  (`core.registrar_acesso_clinico()`) pronta para ser chamada
  explicitamente pela aplicação a cada leitura de prontuário, mas ainda
  não está integrada em nenhuma tela.
- **Convite de colaborador antes do cadastro:** hoje o RH só consegue
  adicionar um colaborador que já existe na plataforma (com conta criada
  e papel "colaborador"). Não existe fluxo de convite por e-mail para
  quem ainda não tem conta.

## Questões regulatórias em aberto (LGPD/CFP)

- **Controlador de dados (LGPD):** recomendação de que o psicólogo seja o
  controlador dos dados clínicos, e a plataforma atue como operadora —
  isso precisa ser formalizado em contrato, não é só decisão técnica.
- **Uso de IA na prática clínica:** ainda não há resolução fechada do CFP
  especificamente sobre IA (só notas de posicionamento, a mais recente de
  julho de 2025). O princípio orientador é "a IA organiza, o psicólogo
  interpreta" — mantê-lo como linha-guia de qualquer funcionalidade de IA
  futura.
- **Retenção de prontuário:** a Resolução CFP nº 001/2009 exige guarda de
  registro por até 20 anos — a arquitetura de retenção/backup de longo
  prazo ainda precisa ser desenhada.

## Como rodar localmente

```bash
# Backend (schema do banco)
cd supabase
supabase link --project-ref <seu-project-ref>
supabase db push

# Frontend
cd web
npm install
npm run dev
```

Variáveis de ambiente necessárias em `web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
