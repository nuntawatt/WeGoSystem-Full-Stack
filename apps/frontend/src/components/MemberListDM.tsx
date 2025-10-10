// apps/frontend/src/components/MemberListDM.tsx
import { DEMO_MEMBERS, DEMO_USERS } from '../lib/demoData';
import { useDM } from '../hooks/useDM';

export default function MemberListDM({ groupId }: { groupId: string }) {
  const { openDM } = useDM();
  const me = DEMO_USERS.find((u) => u.uid === 'me')!;
  const members = (DEMO_MEMBERS[groupId] ?? []).filter((m) => m.uid !== me.uid);

  return (
    <aside className="card p-4 space-y-3">
      <div className="font-semibold">Members</div>
      <div className="space-y-2">
        {/* แสดงตัวเอง */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 opacity-90">
            <img src={me.avatar} className="h-7 w-7 rounded-full object-cover" />
            <div>Me (You)</div>
          </div>
          <button className="btn-ghost cursor-default opacity-40">แชทส่วนตัว</button>
        </div>

        {/* สมาชิกคนอื่น */}
        {members.map((m) => (
          <div key={m.uid} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={m.avatar} className="h-7 w-7 rounded-full object-cover" />
              <div>{m.name}</div>
            </div>
            <button className="btn-ghost" onClick={() => openDM(m.uid)}>
              แชทส่วนตัว
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
