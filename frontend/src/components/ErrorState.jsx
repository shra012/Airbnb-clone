export default function ErrorState({ title = 'Something went wrong', message, retry }) {
  return (
    <div className="card-surface border-error/20 bg-error/5 p-8 text-center">
      <h2 className="text-xl font-semibold text-error">{title}</h2>
      {message && <p className="mt-2 text-sm text-airbnb-charcoal/70">{message}</p>}
      {retry && (
        <button
          type="button"
          className="btn btn-primary mt-6 rounded-full border-none px-6"
          onClick={retry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
