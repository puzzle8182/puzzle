import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { Icon } from '@/components/icon'
import { HeroPhoto } from '@/components/hero-photo'

const TAG = 'mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage'

const PROBLEMAS = [
  {
    icon: 'card',
    quem: 'Para quem quer começar',
    titulo: 'O custo ainda decide quem começa a terapia',
    texto:
      'Mesmo quando existe vontade de iniciar o acompanhamento, o valor das sessões pode ser o que trava a decisão, principalmente porque psicoterapia raramente se resolve em um único encontro.',
  },
  {
    icon: 'building',
    quem: 'Para quem quer oferecer o benefício',
    titulo: 'Montar uma rede própria dá trabalho demais',
    texto:
      'Selecionar profissionais, administrar pagamentos e gerir o benefício de saúde mental exige uma estrutura que a maioria das empresas não tem tempo de construir sozinha.',
  },
  {
    icon: 'file',
    quem: 'Para quem atende',
    titulo: 'Encontrar pacientes e organizar o histórico consome a rotina',
    texto:
      'Divulgação e indicação ainda são o principal caminho até novos pacientes. E, com o tempo, cada acompanhamento acumula tantos registros que recuperar o que já foi anotado vira trabalho manual.',
  },
] as const

const PASSOS = [
  {
    titulo: 'A empresa contrata o benefício',
    texto: 'Define a modalidade de financiamento (custeio integral ou coparticipação) e quem são os colaboradores elegíveis.',
  },
  {
    titulo: 'O colaborador escolhe o profissional',
    texto: 'Conhece formação, abordagem e disponibilidade de cada psicólogo da rede e decide livremente com quem quer fazer terapia.',
  },
  {
    titulo: 'A sessão acontece e o rateio é automático',
    texto: 'O agendamento respeita a agenda real do psicólogo, e o valor é dividido conforme o contrato da empresa, sem cálculo manual.',
  },
  {
    titulo: 'O psicólogo recebe e paga sua assinatura',
    texto: 'É remunerado por cada atendimento e paga, à parte, uma mensalidade fixa para manter seu perfil e usar a infraestrutura.',
  },
  {
    titulo: 'A tecnologia organiza o acompanhamento',
    texto: 'Registros de sessão viram histórico consultável ao longo do tempo. Quem interpreta e decide continua sendo o profissional.',
  },
]

const PARA_QUEM = [
  {
    icon: 'building',
    tint: 'bg-amber/10',
    titulo: 'Para empresas',
    linha: 'Um benefício de saúde mental sem montar a operação sozinha.',
    texto:
      'A empresa entra com o financiamento, integral ou por coparticipação, e acompanha indicadores agregados de uso e investimento. O que acontece dentro da terapia nunca chega ao ambiente corporativo.',
    bullets: ['Rede de psicólogos já formada', 'Duas modalidades de financiamento', 'Indicadores agregados, nunca individuais'],
  },
  {
    icon: 'users',
    tint: 'bg-sage/20',
    titulo: 'Para colaboradores',
    linha: 'Você escolhe o profissional. A empresa participa do custo.',
    texto:
      'A participação financeira da empresa reduz o valor que sai do seu bolso, mas não interfere em quem você escolhe nem no que é conversado em sessão. A empresa financia o acesso, não a relação terapêutica.',
    bullets: ['Busca livre por perfil, abordagem e agenda', 'Custo menor conforme o contrato da empresa', 'Sigilo garantido por arquitetura, não só por regra'],
  },
  {
    icon: 'brain',
    tint: 'bg-pine/10',
    titulo: 'Para psicólogos',
    linha: 'Presença profissional, demanda corporativa e ferramentas para a prática.',
    texto:
      'A mensalidade dá acesso à rede e à infraestrutura; não é compra de pacientes nem garante volume mínimo de atendimentos. Quem escolhe o profissional continua sendo o colaborador.',
    bullets: ['Perfil, agenda e valores sob seu controle', 'Recebimento direto pelo atendimento', 'Ferramentas de organização clínica com IA'],
  },
] as const

const INTELIGENCIA = [
  'Registros organizados cronologicamente por paciente',
  'Recuperação rápida de temas já documentados',
  'Linha do tempo do acompanhamento',
  'Painéis que separam registro de interpretação clínica',
]

const PAPEIS = [
  { icon: 'building', titulo: 'Sou de uma empresa', hint: 'Contratar e gerenciar o benefício' },
  { icon: 'users', titulo: 'Sou colaborador', hint: 'Usar o benefício da minha empresa' },
  { icon: 'brain', titulo: 'Sou psicólogo(a)', hint: 'Atender pela plataforma' },
] as const

export default function LandingPage() {
  return (
    <div className="bg-paper text-ink">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border-soft bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={28} tone="dark" />
            <span className="font-display text-lg text-ink">Plataforma</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
            <a href="#como-funciona" className="hover:text-ink transition-colors">Como funciona</a>
            <a href="#para-quem" className="hover:text-ink transition-colors">Para quem</a>
            <a href="#privacidade" className="hover:text-ink transition-colors">Privacidade</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-ink-soft hover:text-ink transition-colors sm:block">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-paper hover:bg-pine-dark transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <HeroPhoto />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(23,36,42,0.92)_0%,rgba(23,36,42,0.75)_38%,rgba(23,36,42,0.35)_65%,rgba(23,36,42,0.05)_100%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
            <div className="max-w-xl">
              <p className="mb-5 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage">
                <span className="h-px w-8 bg-sage" />
                Benefício corporativo de psicoterapia
              </p>

              <h1 className="font-display text-[2.35rem] leading-[1.18] text-paper sm:text-5xl sm:leading-[1.15]">
                A <span className="text-sage">empresa</span> financia o acesso.
                <br />
                O <span className="text-sage">colaborador</span> escolhe.
                <br />O <span className="text-sage">psicólogo</span> atende, e recebe pelo seu trabalho.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-paper/80">
                Empresas, colaboradores e psicólogos em um único ecossistema: a empresa paga o
                benefício, o colaborador escolhe livremente com quem fazer terapia, e o profissional
                é remunerado direto pelo atendimento.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/cadastro"
                  className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-pine hover:bg-sage/90 transition-colors"
                >
                  Criar conta gratuita
                </Link>
                <a
                  href="#como-funciona"
                  className="flex items-center gap-1.5 text-sm font-medium text-paper hover:text-sage transition-colors"
                >
                  Ver como funciona
                  <Icon name="arrow-right" width={16} height={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* problemas */}
        <section id="problema" className="border-t border-border-soft bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <p className={TAG}>O que hoje trava o cuidado</p>
              <h2 className="font-display text-3xl text-ink">Três problemas que hoje aparecem separados</h2>
              <p className="mt-3 text-ink-soft leading-7">
                A plataforma nasce da conexão entre eles, sem pedir que nenhuma das partes abra mão do que é seu.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PROBLEMAS.map((p) => (
                <div
                  key={p.titulo}
                  className="rounded-2xl border border-border-soft bg-paper p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-pine/5"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-pine/10 text-pine">
                    <Icon name={p.icon} width={22} height={22} />
                  </div>
                  <p className="mb-2.5 text-sm text-ink-soft">{p.quem}</p>
                  <h3 className="font-display text-xl text-ink leading-snug">{p.titulo}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-ink-soft">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* como funciona */}
        <section id="como-funciona" className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <p className={TAG}>Passo a passo</p>
              <h2 className="font-display text-3xl text-ink">Como funciona, do contrato ao atendimento</h2>
              <p className="mt-3 text-ink-soft leading-7">
                Cinco passos conectam a decisão da empresa até o registro organizado pela tecnologia.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-border-soft bg-white px-6 sm:px-8">
              <ol className="flex flex-col divide-y divide-border-soft">
                {PASSOS.map((passo, i) => (
                  <li key={passo.titulo} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-baseline sm:gap-8">
                    <span className="font-display text-2xl text-sage shrink-0 sm:w-10">{i + 1}</span>
                    <div>
                      <h3 className="text-ink font-medium">{passo.titulo}</h3>
                      <p className="mt-1.5 max-w-2xl text-[15px] leading-7 text-ink-soft">{passo.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* dois fluxos financeiros */}
        <section className="border-t border-border-soft bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <p className={TAG}>Modelo financeiro</p>
              <h2 className="font-display text-3xl text-ink">Dois fluxos financeiros que nunca se misturam</h2>
              <p className="mt-3 text-ink-soft leading-7">
                O psicólogo não financia a sessão do paciente. Ele recebe pelo atendimento e paga, à
                parte, pela infraestrutura que usa.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-pine p-8 text-paper">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-paper/70">Fluxo da sessão</p>
                <div className="flex flex-wrap items-center gap-2.5 font-medium">
                  <span className="rounded-full border border-paper/30 px-3.5 py-1.5 text-sm">Empresa</span>
                  <span className="text-sm font-normal text-paper/70">+ colaborador, se houver coparticipação</span>
                </div>
                <Icon name="arrow-right" className="my-3 text-sage rotate-90" width={18} height={18} />
                <span className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-pine">Psicólogo</span>
                <p className="mt-5 text-sm leading-6 text-paper/75">
                  Financia cada atendimento, integralmente ou em coparticipação, conforme o contrato da empresa.
                </p>
              </div>

              <div className="rounded-2xl border border-border-soft bg-paper p-8">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber">Fluxo da assinatura</p>
                <span className="rounded-full bg-pine px-3.5 py-1.5 text-sm font-medium text-paper">Psicólogo</span>
                <Icon name="arrow-right" className="my-3 text-sage rotate-90" width={18} height={18} />
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full border border-border-soft bg-white px-3.5 py-1.5 text-sm font-medium text-ink">R$ 150/mês</span>
                  <span className="rounded-full border border-border-soft bg-white px-3.5 py-1.5 text-sm text-ink">Plataforma</span>
                </div>
                <p className="mt-5 text-sm leading-6 text-ink-soft">
                  Dá acesso à rede, ao perfil profissional e às ferramentas da plataforma; não é subsídio à sessão de ninguém.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* para quem */}
        <section id="para-quem" className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className={TAG}>Os três lados</p>
            <h2 className="font-display text-3xl text-ink max-w-lg">Feita para os três lados da mesma relação</h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PARA_QUEM.map((item) => (
                <div key={item.titulo} className="overflow-hidden rounded-2xl border border-border-soft bg-white">
                  <div className={`p-7 pb-6 ${item.tint}`}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 text-pine">
                      <Icon name={item.icon} width={22} height={22} />
                    </div>
                    <h3 className="font-display text-xl text-ink">{item.titulo}</h3>
                    <p className="mt-1.5 text-sm font-medium text-ink">{item.linha}</p>
                  </div>
                  <div className="p-7 pt-5">
                    <p className="text-[15px] leading-7 text-ink-soft">{item.texto}</p>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-ink-soft">
                          <Icon name="check" width={15} height={15} className="text-pine shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* inteligência clínica */}
        <section className="border-t border-border-soft bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <p className={TAG}>Inteligência clínica</p>
                <p className="font-display text-3xl italic leading-snug text-ink sm:text-4xl">
                  A IA organiza. Quem interpreta é o psicólogo.
                </p>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-soft">
                  Ao longo de meses ou anos de acompanhamento, os registros de sessão se acumulam. A
                  tecnologia ajuda a recuperar o que já foi documentado; nunca a decidir o que ele significa.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {INTELIGENCIA.map((f) => (
                  <div
                    key={f}
                    className="flex items-start gap-4 rounded-xl border border-border-soft bg-paper p-5 transition hover:border-pine/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage/25 text-pine">
                      <Icon name="brain" width={18} height={18} />
                    </div>
                    <span className="mt-1.5 text-[15px] leading-6 text-ink">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* privacidade */}
        <section id="privacidade" className="border-t border-border-soft bg-pine-dark text-paper">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sage">Privacidade & segurança</p>
            <p className="max-w-xl font-display text-3xl leading-snug sm:text-4xl">
              A empresa financia o cuidado.
              <br />
              Não acessa a terapia.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:bg-white/[0.1]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-sage">
                  <Icon name="lock" width={18} height={18} />
                </div>
                <p className="text-sm leading-6 text-paper/80">
                  Dados clínicos e dados corporativos vivem em ambientes tecnicamente separados:
                  não é apenas uma regra de negócio, é a arquitetura do banco de dados.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:bg-white/[0.1]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-sage">
                  <Icon name="shield" width={18} height={18} />
                </div>
                <p className="text-sm leading-6 text-paper/80">
                  Indicadores para a empresa são sempre agregados e anônimos, com proteção contra
                  reidentificação em grupos pequenos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* cta final */}
        <section className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <p className={TAG}>Comece agora</p>
              <h2 className="font-display text-3xl text-ink">Comece de onde você está</h2>
              <p className="mt-3 text-ink-soft leading-7">O cadastro leva menos de dois minutos.</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {PAPEIS.map((r) => (
                <Link
                  key={r.titulo}
                  href="/cadastro"
                  className="group flex flex-col justify-between rounded-2xl border border-border-soft bg-white p-7 transition hover:-translate-y-1 hover:border-pine hover:shadow-lg hover:shadow-pine/5"
                >
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine">
                      <Icon name={r.icon} width={20} height={20} />
                    </div>
                    <p className="font-medium text-ink">{r.titulo}</p>
                    <p className="mt-1.5 text-sm text-ink-soft">{r.hint}</p>
                  </div>
                  <span className="mt-6 flex items-center gap-1.5 text-sm font-medium text-pine">
                    Cadastrar
                    <Icon
                      name="arrow-right"
                      width={15}
                      height={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <BrandMark size={24} tone="light" />
            <span className="font-display text-lg">Plataforma</span>
          </div>
          <p className="text-sm text-paper/50">Autonomia clínica sempre com o psicólogo.</p>
          <p className="text-sm text-paper/50">Conformidade com a LGPD e as normas do CFP/CRP.</p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-paper/70">
            <Link href="/login" className="hover:text-paper transition-colors">Entrar</Link>
            <Link href="/cadastro" className="hover:text-paper transition-colors">Cadastre-se</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
