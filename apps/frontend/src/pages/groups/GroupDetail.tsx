// apps/frontend/src/pages/groups/GroupDetail.tsx
import { useParams } from 'react-router-dom';
import ChatPanel from '../../components/ChatPanel';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import RatingDialog from '../../components/RatingDialog';
import MemberListDM from '../../components/MemberListDM';

export default function GroupDetail() {
  const { id } = useParams();
  const gid = id || '';

  return (
    <section className="container-app py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ChatPanel groupId={gid} />
        <RatingDialog />
      </div>
      <div className="space-y-6">
        <MemberListDM groupId={gid} />
        <AvailabilityPicker />
      </div>
    </section>
  );
}
