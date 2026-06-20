export default function Loading() {
  return (
    <main className="page-loading" aria-live="polite" aria-busy="true">
      <div className="page-spinner" aria-hidden="true" />
      <span>Cargando...</span>
    </main>
  );
}
