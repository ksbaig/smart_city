import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Hash, TrendingUp, Users, ArrowLeftRight, Wallet, Coins, Receipt, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al Murabba Branch Dashboard — Demo Riyadh Bank" },
      { name: "description", content: "Monthly performance overview for the Al Murabba demo bank branch in Riyadh." },
      { property: "og:title", content: "Al Murabba Branch Dashboard" },
      { property: "og:description", content: "Branch visits, transactions, deposits, revenue and profit at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const sar = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n: number) => n.toLocaleString("en-US");

const metrics = [
  { label: "Customer Visits", value: num(5346), icon: Users },
  { label: "Transactions", value: num(25985), icon: ArrowLeftRight },
  { label: "Deposits", value: sar(21716449.56), unit: "SAR", icon: Wallet },
  { label: "Revenue", value: sar(273133.36), unit: "SAR", icon: Coins },
  { label: "Operating Cost", value: sar(91375.97), unit: "SAR", icon: Receipt },
];

function Index() {
  const info = [
    { label: "District", value: "Al Murabba", icon: MapPin },
    { label: "Branch ID", value: "BR-20101", icon: Hash },
    { label: "Bank", value: "Demo Riyadh Bank (Fictional)", icon: Building2 },
  ];
  return (
    <div className="min-h-screen bg-app p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Monthly overview</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Al Murabba <span className="text-brand">Demo Branch</span>
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground">
            <TrendingUp className="h-4 w-4" /> Performance: Strong
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {info.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass flex items-center gap-4 rounded-2xl p-4">
              <div className="rounded-xl bg-brand p-2.5 text-primary-foreground"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="truncate font-display font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="glass overflow-hidden rounded-3xl">
            <iframe
              title="Branch location map"
              className="h-[420px] w-full lg:h-full lg:min-h-[560px]"
              src="https://www.openstreetmap.org/export/embed.html?bbox=46.700%2C24.660%2C46.722%2C24.674&layer=mapnik&marker=24.667%2C46.711"
              loading="lazy"
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl bg-brand p-6 text-primary-foreground shadow-[var(--shadow-glow)]">
              <div className="flex items-center gap-2 text-sm font-semibold opacity-80"><PiggyBank className="h-4 w-4" /> Net Profit</div>
              <p className="mt-2 font-display text-4xl font-bold">{sar(181757.39)}</p>
              <p className="text-sm font-medium opacity-80">SAR · 66.5% margin</p>
            </div>
            {metrics.map(({ label, value, unit, icon: Icon }) => (
              <div key={label} className="glass flex items-center justify-between rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <span className="font-display font-semibold">
                  {value} {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
