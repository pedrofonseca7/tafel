import Link from 'next/link'

export default function LandingPage() {
  return (
    <main>
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl">TAFEL</span>
        <nav className="flex gap-3">
          <Link href="/login" className="btn-primary text-sm py-2">Entrar</Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] mb-6">
            O menu do teu restaurante, num QR Code.
          </h1>
          <p className="text-lg text-ink/70 mb-8 max-w-md">
            O cliente lê o código na mesa, escolhe o que quer e o pedido chega ao teu painel na hora.
            Sem apps para instalar. Sem contas para criar.
          </p>
          <div className="flex gap-3">
            <Link href="/login" className="btn-primary">Entrar no meu restaurante</Link>
            <a href="#como-funciona" className="btn-secondary">Ver como funciona</a>
          </div>
        </div>
        <div className="card p-6 rotate-1">
          <div className="rounded-card overflow-hidden border border-line mb-4 aspect-[4/5] bg-gradient-to-br from-paprika/10 to-sage/10 flex items-center justify-center">
            <div className="text-center px-6">
              <p className="font-display text-2xl mb-2">Mesa 7</p>
              <p className="text-sm text-ink/60">Hambúrguer Clássico · €12,50</p>
              <div className="mt-4 inline-block bg-paprika text-paper text-sm px-4 py-2 rounded-card">
                Fazer pedido
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="max-w-5xl mx-auto px-6 py-16 border-t border-line">
        <h2 className="font-display text-3xl mb-10">Três passos, sem fricção</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            ['O cliente lê o QR', 'A câmara do telemóvel abre o menu da mesa certa, automaticamente.'],
            ['Escolhe e confirma', 'Adiciona produtos, extras e envia o pedido — sem instalar nada.'],
            ['Chega ao teu painel', 'Alerta sonoro e visual imediato. Aceitas, preparas, entregas.']
          ].map(([title, desc]) => (
            <div key={title}>
              <h3 className="font-medium text-lg mb-2">{title}</h3>
              <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-10 border-t border-line text-sm text-ink/50">
        TAFEL — plataforma de menu digital multi-restaurante.
      </footer>
    </main>
  )
}
