import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsAPI } from '../lib/api';
import { showSuccess, showError } from '../lib/swal';

export type Group = {
  _id?: string;
  name: string;
  members: string[];
  createdAt: Date;
};

export function useGroups() {
  const queryClient = useQueryClient();

  const groups = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll().then(res => res.data),
  });

  const createGroup = useMutation({
    mutationFn: groupsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('สร้างกลุ่มสำเร็จ!', 'กลุ่มของคุณถูกสร้างแล้ว');
    },
    onError: (error: any) => {
      showError('สร้างกลุ่มไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('อัพเดทกลุ่มสำเร็จ!', 'ข้อมูลกลุ่มถูกบันทึกแล้ว');
    },
    onError: (error: any) => {
      showError('อัพเดทกลุ่มไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const deleteGroup = useMutation({
    mutationFn: groupsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('ลบกลุ่มสำเร็จ!', 'กลุ่มถูกลบแล้ว');
    },
    onError: (error: any) => {
      showError('ลบกลุ่มไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const joinGroup = useMutation({
    mutationFn: groupsAPI.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('เข้าร่วมกลุ่มสำเร็จ!', 'คุณเป็นสมาชิกกลุ่มแล้ว');
    },
    onError: (error: any) => {
      showError('เข้าร่วมกลุ่มไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const leaveGroup = useMutation({
    mutationFn: groupsAPI.leave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('ออกจากกลุ่มสำเร็จ!', 'คุณออกจากกลุ่มแล้ว');
    },
    onError: (error: any) => {
      showError('ออกจากกลุ่มไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  return { groups, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup, };
}