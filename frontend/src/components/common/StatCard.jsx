// Soft pastel chip per tone (bg-{color}-100 + text-{color}-600) instead of a
// solid saturated square - matches the status-badge style used elsewhere in
// the app (see utils/statusColors.js) so a color means the same thing
// everywhere, just applied to a card icon instead of a pill.
const TONES = {
  primary: 'bg-primary-100 text-primary-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
};

export default function StatCard({ label, value, tone = 'primary' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg ${TONES[tone] || TONES.primary} flex items-center justify-center font-bold`}>
        {value}
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
