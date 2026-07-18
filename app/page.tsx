import ProbabilityWindow from '../components/ProbabilityWindow';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Buno</h1>
      <ProbabilityWindow
        safetyRangeLow={250}
        safetyRangeHigh={340}
        riskLabel="safe"
        recentAverage={220}
      />
    </main>
  );
}
