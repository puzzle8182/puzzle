import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { Icon } from '@/components/icon'
import { HeroNetwork } from '@/components/hero-network'

const PROBLEMAS = [
  {
    quem: 'Para quem quer começar',
    titulo: 'O custo ainda decide quem começa a terapia',
    texto:
      'Mesmo quando existe vontade de iniciar o acompanhamento, o valor das sessões pode ser o que trava a decisão — principalmente porque psicoterapia raramente se resolve em um único encontro.',
  },
  {
    quem: 'Para quem quer oferecer o benefício',
    titulo: 'Montar uma rede própria dá trabalho demais',
    texto:
      'Selecionar profissionais, administrar pagamentos e gerir o benefício de saúde mental exige uma estrutura que a maioria das empresas não tem tempo de construir sozinha.',
  },
  {
    quem: 'Para quem atende',
    titulo: 'Encontrar pacientes e organizar o histórico consome a rotina',
    texto:
      'Divulgação e indicação ainda são o principal caminho até novos pacientes. E, com o tempo, cada acompanhamento acumula tantos registros que recuperar o que já foi anotado vira trabalho manual.',
  },
]

const PASSOS = [
  {
    titulo: 'A empresa contrata o benefício',
    texto: 'Define a modalidade de financiamento — custeio integral ou coparticipação — e quem são os colaboradores elegíveis.',
  },
  {
    titulo: 'O colaborador escolhe o profissional',
    texto: 'Conhece formação, abordagem e disponibilidade de cada psicólogo da rede e decide livremente com quem quer fazer terapia.',
  },
  {
    titulo: 'A sessão acontece e o rateio é automático',
    texto: 'O agendamento respeita a agenda real do psicólogo, e o valor é dividido conforme o contrato da empresa — sem cálculo manual.',
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
    titulo: 'Para empresas',
    linha: 'Um benefício de saúde mental sem montar a operação sozinha.',
    texto:
      'A empresa entra com o financiamento — integral ou por coparticipação — e acompanha indicadores agregados de uso e investimento. O que acontece dentro da terapia nunca chega ao ambiente corporativo.',
    bullets: ['Rede de psicólogos já formada', 'Duas modalidades de financiamento', 'Indicadores agregados, nunca individuais'],
  },
  {
    icon: 'users',
    titulo: 'Para colaboradores',
    linha: 'Você escolhe o profissional. A empresa participa do custo.',
    texto:
      'A participação financeira da empresa reduz o valor que sai do seu bolso, mas não interfere em quem você escolhe nem no que é conversado em sessão. A empresa financia o acesso, não a relação terapêutica.',
    bullets: ['Busca livre por perfil, abordagem e agenda', 'Custo menor conforme o contrato da empresa', 'Sigilo garantido por arquitetura, não só por regra'],
  },
  {
    icon: 'brain',
    titulo: 'Para psicólogos',
    linha: 'Presença profissional, demanda corporativa e ferramentas para a prática.',
    texto:
      'A mensalidade dá acesso à rede e à infraestrutura — não é compra de pacientes nem garante volume mínimo de atendimentos. Quem escolhe o profissional continua sendo o colaborador.',
    bullets: ['Perfil, agenda e valores sob seu controle', 'Recebimento direto pelo atendimento', 'Ferramentas de organização clínica com IA'],
  },
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
              className="rounded-lg bg-pine px-4 py-2 text-sm font-medium text-paper hover:bg-pine-dark transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium text-ink-soft mb-5">Benefício corporativo de psicoterapia</p>

              <h1 className="font-display text-[2.35rem] leading-[1.18] text-ink sm:text-5xl sm:leading-[1.15]">
                A <span className="text-pine">empresa</span> financia o acesso.
                <br />
                O <span className="text-pine">colaborador</span> escolhe.
                <br />O <span className="text-pine">psicólogo</span> atende — e recebe pelo seu trabalho.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-ink-soft">
                Empresas, colaboradores e psicólogos em um único ecossistema: a empresa paga o
                benefício, o colaborador escolhe livremente com quem fazer terapia, e o profissional
                é remunerado direto pelo atendimento.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/cadastro"
                  className="rounded-lg bg-pine px-6 py-3 text-sm font-medium text-paper hover:bg-pine-dark transition-colors"
                >
                  Criar conta gratuita
                </Link>
                <a
                  href="#como-funciona"
                  className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-pine transition-colors"
                >
                  Ver como funciona
                  <Icon name="arrow-right" width={16} height={16} />
                </a>
              </div>
            </div>

            <HeroNetwork />
          </div>
        </section>

        {/* problemas */}
        <section className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <h2 className="font-display text-3xl text-ink">Três problemas que hoje aparecem separados</h2>
              <p className="mt-3 text-ink-soft leading-7">
                A plataforma nasce da conexão entre eles, sem pedir que nenhuma das partes abra mão do que é seu.
              </p>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PROBLEMAS.map((p) => (
                <div key={p.titulo} className="border-t border-border-soft pt-5">
                  <p className="text-sm text-ink-soft mb-2.5">{p.quem}</p>
                  <h3 className="font-display text-xl text-ink leading-snug">{p.titulo}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-ink-soft">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* como funciona */}
        <section id="como-funciona" className="border-t border-border-soft bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <h2 className="font-display text-3xl text-ink">Como funciona, do contrato ao atendimento</h2>
              <p className="mt-3 text-ink-soft leading-7">
                Cinco passos conectam a decisão da empresa até o registro organizado pela tecnologia.
              </p>
            </div>

            <ol className="mt-12 flex flex-col divide-y divide-border-soft">
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
        </section>

        {/* dois fluxos financeiros */}
        <section className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <h2 className="font-display text-3xl text-ink">Dois fluxos financeiros que nunca se misturam</h2>
              <p className="mt-3 text-ink-soft leading-7">
                O psicólogo não financia a sessão do paciente. Ele recebe pelo atendimento e paga, à
                parte, pela infraestrutura que usa.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border-soft bg-white p-7">
                <p className="text-sm font-medium text-pine mb-4">Fluxo da sessão</p>
                <div className="flex flex-wrap items-center gap-2.5 text-ink font-medium">
                  <span className="rounded-full border border-border-soft px-3.5 py-1.5 text-sm">Empresa</span>
                  <span className="text-ink-soft text-sm font-normal">+ colaborador, se houver coparticipação</span>
                </div>
                <Icon name="arrow-right" className="my-3 text-sage rotate-90" width={18} height={18} />
                <span className="rounded-full bg-pine px-3.5 py-1.5 text-sm font-medium text-paper">Psicólogo</span>
                <p className="mt-5 text-sm leading-6 text-ink-soft">
                  Financia cada atendimento, integralmente ou em coparticipação, conforme o contrato da empresa.
                </p>
              </div>

              <div className="rounded-xl border border-border-soft bg-white p-7">
                <p className="text-sm font-medium text-amber mb-4">Fluxo da assinatura</p>
                <span className="rounded-full bg-pine px-3.5 py-1.5 text-sm font-medium text-paper">Psicólogo</span>
                <Icon name="arrow-right" className="my-3 text-sage rotate-90" width={18} height={18} />
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full border border-border-soft px-3.5 py-1.5 text-sm font-medium text-ink">R$ 150/mês</span>
                  <span className="rounded-full border border-border-soft px-3.5 py-1.5 text-sm text-ink">Plataforma</span>
                </div>
                <p className="mt-5 text-sm leading-6 text-ink-soft">
                  Dá acesso à rede, ao perfil profissional e às ferramentas da plataforma — não é subsídio à sessão de ninguém.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* para quem */}
        <section id="para-quem" className="border-t border-border-soft bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-3xl text-ink max-w-lg">Feita para os três lados da mesma relação</h2>

            <div className="mt-14 flex flex-col gap-16">
              {PARA_QUEM.map((item) => (
                <div key={item.titulo} className="grid items-start gap-8 md:grid-cols-[auto_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sage/20 text-pine">
                    <Icon name={item.icon} width={26} height={26} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-ink">{item.titulo}</h3>
                    <p className="mt-1.5 text-ink font-medium">{item.linha}</p>
                    <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">{item.texto}</p>
                    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-ink-soft">
                          <Icon name="check" width={15} height={15} className="text-pine shrink-0" />
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
        <section className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-sm font-medium text-ink-soft mb-4">Inteligência clínica</p>
                <p className="font-display text-3xl italic leading-snug text-ink sm:text-4xl">
                  A IA organiza. Quem interpreta é o psicólogo.
                </p>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-ink-soft">
                  Ao longo de meses ou anos de acompanhamento, os registros de sessão se acumulam. A
                  tecnologia ajuda a recuperar o que já foi documentado — nunca a decidir o que ele significa.
                </p>
              </div>

              <ul className="flex flex-col divide-y divide-border-soft">
                {[
                  'Registros organizados cronologicamente por paciente',
                  'Recuperação rápida de temas já documentados',
                  'Linha do tempo do acompanhamento',
                  'Painéis que separam registro de interpretação clínica',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 py-3.5 text-ink">
                    <Icon name="brain" width={18} height={18} className="text-sage mt-0.5 shrink-0" />
                    <span className="text-[15px]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* privacidade */}
        <section id="privacidade" className="bg-pine-dark text-paper">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
              <p className="font-display text-3xl leading-snug sm:text-4xl">
                A empresa financia o cuidado.
                <br />
                Não acessa a terapia.
              </p>
              <div className="flex flex-col gap-4 max-w-sm">
                <div className="flex items-start gap-3">
                  <Icon name="lock" width={18} height={18} className="mt-0.5 shrink-0 text-sage" />
                  <p className="text-sm leading-6 text-paper/80">
                    Dados clínicos e dados corporativos vivem em ambientes tecnicamente separados —
                    não é apenas uma regra de negócio, é a arquitetura do banco de dados.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="shield" width={18} height={18} className="mt-0.5 shrink-0 text-sage" />
                  <p className="text-sm leading-6 text-paper/80">
                    Indicadores para a empresa são sempre agregados e anônimos, com proteção contra
                    reidentificação em grupos pequenos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* cta final */}
        <section className="border-t border-border-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-lg">
              <h2 className="font-display text-3xl text-ink">Comece de onde você está</h2>
              <p className="mt-3 text-ink-soft leading-7">O cadastro leva menos de dois minutos.</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { titulo: 'Sou de uma empresa', hint: 'Contratar e gerenciar o benefício' },
                { titulo: 'Sou colaborador', hint: 'Usar o benefício da minha empresa' },
                { titulo: 'Sou psicólogo(a)', hint: 'Atender pela plataforma' },
              ].map((r) => (
                <Link
                  key={r.titulo}
                  href="/cadastro"
                  className="group flex flex-col justify-between rounded-xl border border-border-soft bg-white p-6 hover:border-pine transition-colors"
                >
                  <div>
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

      <footer className="border-t border-border-soft">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark size={22} tone="dark" />
            <span className="font-display text-ink">Plataforma</span>
          </div>
          <p className="text-sm text-ink-soft max-w-md">
            Autonomia clínica sempre com o psicólogo. Conformidade com a LGPD e as normas do CFP/CRP.
          </p>
          <div className="flex items-center gap-5 text-sm text-ink-soft">
            <Link href="/login" className="hover:text-ink transition-colors">Entrar</Link>
            <Link href="/cadastro" className="hover:text-ink transition-colors">Cadastre-se</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
