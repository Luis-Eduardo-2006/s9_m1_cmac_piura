// Sanitización de texto libre que se ALMACENA (defensa en profundidad contra XSS
// almacenado). El frontend (React) ya escapa al renderizar, pero además quitamos
// cualquier etiqueta HTML en el backend para no persistir <script>…</script> ni
// otros tags. No es "encoding" de salida; es limpieza de entrada.
function sanitizarTexto(valor) {
  if (valor == null) return valor;
  return String(valor).replace(/<[^>]*>/g, '').trim();
}

module.exports = { sanitizarTexto };
