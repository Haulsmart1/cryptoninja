import Link from "next/link";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export function PricingCard({ name, price, description, features, highlighted }: PricingCardProps) {
  return (
    <div className={`rounded-3xl p-6 ${highlighted ? "bg-cyan-400 text-slate-950" : "glass"}`}>
      <h3 className="text-xl font-bold">{name}</h3>
      <p className={highlighted ? "mt-2 text-slate-800" : "mt-2 text-slate-400"}>{description}</p>
      <p className="mt-6 text-4xl font-black">{price}</p>
      <Link
        className={`mt-6 inline-flex rounded-xl px-4 py-3 font-semibold ${
          highlighted ? "bg-slate-950 text-white" : "bg-white text-slate-950"
        }`}
        href="/dashboard"
      >
        Start testing
      </Link>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
    </div>
  );
}
