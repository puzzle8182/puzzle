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
- **Videochamada:** Daily.co, via chamadas assíncronas do Postgres
  (`pg_net`) — nenhuma dependência de vídeo no frontend além de um
  `<iframe>`

## Estrutura do banco de dados

Três schemas segregam fisicamente o que é corporativo do que é clínico:

- **`corporate`** — empresas, contratos, colaboradores elegíveis, faturas.
  Tudo que a empresa pode enxergar (dado administrativo/financeiro).
- **`clinical`** — psicólogos, prontuário (notas de sessão, anamnese,
  hipóteses diagnósticas versionadas, intercorrências, objetivos
  terapêuticos, autorizações de suporte). **Nenhuma policy de RLS dá
  acesso a `empresa_admin` aqui.**
- **`core`** — agendamentos, os dois fluxos financeiros (sessão e
  assinatura), avaliações de reputação do psicólogo e as salas de vídeo
  (`salas_video`, `video_requests`). Não é clínico, mas também não
  pertence só à empresa.

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

Acesso administrativo a dado clínico (ex.: suporte investigando um
problema) segue o mesmo princípio: nunca é permanente. A tabela
`clinical.autorizacoes_suporte` registra motivo e expiração (padrão de 7
dias), e `clinical.existe_autorizacao_ativa()` (`security definer`)
condiciona toda policy de `admin_plataforma` sobre dado clínico à
existência de uma autorização ativa. O colaborador tem visibilidade sobre
essas autorizações concedidas sobre o próprio prontuário, mesmo sem poder
revogá-las diretamente (só o psicólogo concede/revoga).

### Videochamada: sala criada sob demanda, nunca reaproveitada indevidamente

`core.salas_video` e `core.video_requests` não têm nenhuma policy de
`SELECT`/`INSERT` para `authenticated` — todo acesso passa por funções
`security definer` (`iniciar_criar_sala`, `checar_criar_sala`,
`iniciar_criar_token`, `checar_criar_token`, `obter_sala_video`), que
fazem sua própria checagem de participação no agendamento antes de
qualquer leitura ou escrita. Como o Postgres não faz chamadas HTTP de
forma síncrona, a criação de sala/token no Daily.co segue um padrão de
"iniciar + checar": `iniciar_*` dispara a chamada via `pg_net` e devolve
um `request_id`; o frontend consulta `checar_*` em polling até a resposta
chegar. Um pedido de criação de sala recente (< 30s) é reaproveitado por
qualquer participante que chame `iniciar_criar_sala` nesse intervalo, para
evitar que dois pedidos simultâneos colidam na API do Daily.co. A chave
da API fica no Vault (`daily_api_key`), nunca em código ou variável de
ambiente do frontend.

## Estado atual (testado de ponta a ponta)

✅ Schema completo aplicado via migrations versionadas (`supabase/migrations/`)
✅ Autenticação funcionando para os 3 papéis de usuário final
✅ Layout com sidebar adaptável por papel
✅ Cadastro/login/logout
✅ Psicólogo: formulário de perfil profissional (CRP, abordagem, bio, áreas
  de atuação, valor da sessão) + editor de disponibilidade semanal
✅ Colaborador: busca de psicólogos, agendamento de sessão restrito aos
  horários reais de disponibilidade do psicólogo (validado no servidor,
  não confia no formulário), com cálculo automático do rateio financeiro,
  lista de agendamentos
✅ Conflito de horário na agenda: índice único parcial no banco
  (`agendamentos_sem_conflito_horario`) impede dois colaboradores
  reservando o mesmo horário com o mesmo psicólogo, mesmo em caso de
  requisições simultâneas (condição de corrida) — a Server Action dá uma
  checagem prévia amigável, mas a garantia real é a constraint no banco
✅ Empresa: cadastro da própria empresa (nome, CNPJ, modalidade de
  financiamento), gestão de colaboradores elegíveis (adicionar por e-mail,
  listar com status)
✅ Agenda unificada (`/agendamentos`): a mesma página serve colaborador e
  psicólogo, filtrando por papel — antes só existia a visão do colaborador
✅ Prontuário clínico: psicólogo vê lista de pacientes (colaboradores com
  quem já teve sessão), registra uma nota por sessão, registra anamnese
  (queixa principal, histórico clínico/familiar/laboral, rede de apoio,
  objetivos e intercorrências iniciais — uma por par colaborador+
  psicólogo, editável), tudo com log de auditoria de acesso
✅ Página `/prontuarios`: visão agregada do próprio psicólogo (total de
  pacientes com prontuário, anamneses registradas, hipóteses diagnósticas
  ativas, notas de sessão no mês), com lista de pacientes linkando para o
  prontuário individual de cada um
✅ Página `/financeiro` do psicólogo: extrato de pagamentos por sessão
  (`core.pagamentos_sessao`) com status (pago/pendente/falhou/estornado) e
  status da assinatura da plataforma
✅ Verificação de documentação: psicólogo envia comprovante do CRP
  (upload para Supabase Storage, bucket privado); responsável técnico
  (papel `admin_plataforma`) aprova ou rejeita antes do perfil aparecer
  na busca — separado do status de assinatura (financeiro)
🟡 Videochamada via Daily.co: backend completo e testado de ponta a ponta
  (criação de sala real, geração de token, `<iframe>` carregando a sala) —
  bloqueado apenas pela exigência do Daily.co de forma de pagamento
  cadastrada na conta para efetivamente entrar em uma sala, mesmo dentro
  do free tier (10.000 min/mês). Ver seção de gaps.

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
5. **Perfis de pacientes invisíveis para o psicólogo:** mesmo padrão do
   bug anterior — o psicólogo não conseguia ver nome/e-mail dos próprios
   pacientes. Corrigido com policy análoga baseada em vínculo de
   agendamento.
6. **Link "Agenda" do psicólogo apontava para `/dashboard`:** um item de
   navegação (`lib/nav-config.ts`) ficou desatualizado depois que
   `/agendamentos` passou a servir os dois papéis — o psicólogo nunca
   conseguia chegar na própria agenda pelo menu lateral. Corrigido
   apontando para a rota certa.

### Lições da portabilidade do protótipo 1.0 (`micaelsonnen/Puzzle`)

O prontuário inteligente (anamnese, hipóteses diagnósticas, intercorrências)
e a videochamada via Daily.co foram portados de um protótipo anterior,
adaptados ao modelo de schemas separados do 2.0. A auditoria da RLS
original revelou padrões a evitar:

1. **Coluna de visibilidade não aplicada na policy:** a tabela original
   tinha uma flag `visivel_paciente`, mas a policy de `SELECT` do paciente
   ignorava essa flag e liberava todas as linhas. Corrigido incluindo a
   condição diretamente na cláusula `USING`.
2. **Duas policies permissivas de `INSERT` no mesmo comando se somam por
   OR, não por AND:** existiam duas regras de inserção em uma tabela — uma
   exigia sessão concluída, a outra não — e a segunda anulava a proteção
   da primeira. Consolidado em uma única policy.
3. **`FOR ALL` concedia UPDATE/DELETE onde o negócio exige versionamento
   apenas por INSERT:** hipóteses diagnósticas devem ser sempre
   preservadas (soft-flag `ativa = false` na antiga + nova linha), nunca
   sobrescritas. Corrigido restringindo a policy a `SELECT`+`INSERT` e
   **não concedendo `UPDATE`/`DELETE`** — o versionamento agora é
   garantido por ausência de privilégio, não por convenção de código.
4. **Tabela de autorização de acesso sem visibilidade para o titular do
   dado:** o paciente não tinha nenhuma policy sobre a tabela que registra
   quem acessou seu prontuário. Adicionada uma policy de `SELECT` para o
   colaborador ver autorizações concedidas sobre si mesmo (LGPD).
5. **Identificação por `auth.jwt() ->> 'email'` em vez de `auth.uid()`:**
   todas as funções de vídeo do 1.0 comparavam e-mail do JWT com colunas
   de e-mail em tabelas de psicólogo/paciente — frágil se o e-mail mudar
   sem sincronizar. Portado para `auth.uid()` comparado direto contra
   `psicologo_id`/`colaborador_profile_id`, mesmo padrão já usado no
   resto do 2.0.

## O que ainda falta (gaps conhecidos)

- **Videochamada — forma de pagamento no Daily.co:** o backend está
  pronto e testado (sala real criada, token gerado, iframe carregando),
  mas o Daily.co exige uma forma de pagamento cadastrada na conta para
  efetivamente entrar em uma sala, mesmo dentro do free tier. Decisão
  consciente de aguardar a compra do domínio da empresa antes de
  cadastrar cartão, para resolver os dois de uma vez.
- **Cobrança/billing:** a mensalidade do psicólogo (R$ 150) e o pagamento
  da sessão ainda não têm Edge Functions de integração com gateway de
  pagamento. Hoje a ativação da assinatura (`status_assinatura = 'ativa'`)
  precisa ser feita manualmente. A estrutura de rateio (`valor_empresa`,
  `valor_colaborador`, `gateway_transaction_id` em
  `core.pagamentos_sessao`) já existe, falta a integração real. Também
  aguardando CNPJ.
- **Confirmação de e-mail:** já reativada no Supabase Auth. Falta
  configurar um provedor de e-mail transacional (o padrão do Supabase é
  só para testes, com limite de envio baixo) — o 1.0 já validou esse
  fluxo com Resend, mas depende do mesmo domínio próprio mencionado acima
  para verificação de envio.
- **Convite de colaborador antes do cadastro:** hoje o RH só consegue
  adicionar um colaborador que já existe na plataforma (com conta criada
  e papel "colaborador"). Não existe fluxo de convite por e-mail para
  quem ainda não tem conta.
- **Indicadores da empresa no frontend:** a função
  `corporate.get_indicadores_empresa()` existe e tem proteção de grupo
  mínimo, mas ainda não tem tela no frontend (`/indicadores` na sidebar
  ainda não foi implementada). Estatísticas de fluência do tratamento
  (sem dado clínico sensível) — próximo item da fila.
- **Criação de conta `admin_plataforma` é manual:** não existe fluxo de
  convite seguro — hoje a pessoa se cadastra com qualquer papel e depois
  alguém com acesso ao banco roda um `UPDATE` no SQL Editor pra promover
  a conta. Funciona para um responsável técnico único, mas não escala
  para múltiplos admins nem tem trilha de auditoria de quem promoveu quem.
- **Linha do tempo/painel longitudinal do prontuário:** os dados
  estruturados (anamnese, hipóteses, intercorrências, notas de sessão)
  existem, mas ainda não há uma visualização consolidada em ordem
  cronológica — hoje cada tipo de registro aparece em sua própria seção
  na página do prontuário.

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