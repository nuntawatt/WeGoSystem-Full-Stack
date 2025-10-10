// Purpose: members list UI (demo data/fallback)
export default function MemberList() {
  const members = [
    { id: '1', name: 'Mina', role: 'owner' },
    { id: '2', name: 'Kai', role: 'member' },
    { id: '3', name: 'Fah', role: 'member' }
  ];
  return (
    <div className="card p-4">
      <div className="text-lg font-semibold mb-3">Members</div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center">
                {m.name[0]}
              </div>
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs opacity-70">{m.role}</div>
              </div>
            </div>
            <button className="px-3 py-1 rounded-lg ring-1 ring-white/10 hover:bg-white/10 text-sm">
              Message
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}