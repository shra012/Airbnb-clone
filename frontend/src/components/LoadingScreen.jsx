export default function LoadingScreen({ message = 'Loading...', fullScreen = false }) {
  const containerClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center bg-base-200'
    : 'card-surface flex min-h-[320px] items-center justify-center p-10';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4 text-airbnb-charcoal">
        <span className="loading loading-infinity loading-lg text-airbnb-primary" />
        <p className="text-sm text-airbnb-charcoal/60">{message}</p>
      </div>
    </div>
  );
}
