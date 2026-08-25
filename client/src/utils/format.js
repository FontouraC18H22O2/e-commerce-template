// Preços guardam-se sempre em cêntimos (inteiros) na BD e na API — só se
// convertem para euros aqui, no último passo antes de mostrar ao utilizador.
export function formatPrice(cents) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}
