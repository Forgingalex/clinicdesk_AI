interface AdminCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function AdminCard({ title, value, subtitle }: AdminCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}




