import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesAPI } from '../lib/api';
import { showSuccess, showError } from '../lib/swal';

export type Activity = { _id?: string; title: string; description?: string; date: Date; participants: string[]; };

export function useActivities() {
  const queryClient = useQueryClient();

  const activities = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => activitiesAPI.getAll().then(res => res.data),
  });

  const createActivity = useMutation({
    mutationFn: activitiesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('สร้างกิจกรรมสำเร็จ!', 'กิจกรรมของคุณถูกสร้างแล้ว');
    },
    onError: (error: any) => {
      showError('สร้างกิจกรรมไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const updateActivity = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      activitiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('อัพเดทกิจกรรมสำเร็จ!', 'ข้อมูลถูกบันทึกแล้ว');
    },
    onError: (error: any) => {
      showError('อัพเดทกิจกรรมไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const deleteActivity = useMutation({
    mutationFn: activitiesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('ลบกิจกรรมสำเร็จ!', 'กิจกรรมถูกลบแล้ว');
    },
    onError: (error: any) => {
      showError('ลบกิจกรรมไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const joinActivity = useMutation({
    mutationFn: activitiesAPI.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('เข้าร่วมกิจกรรมสำเร็จ!', 'คุณเข้าร่วมแล้ว');
    },
    onError: (error: any) => {
      showError('เข้าร่วมกิจกรรมไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  const leaveActivity = useMutation({
    mutationFn: activitiesAPI.leave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('ออกจากกิจกรรมสำเร็จ!', 'คุณออกจากกิจกรรมแล้ว');
    },
    onError: (error: any) => {
      showError('ออกจากกิจกรรมไม่สำเร็จ', error?.message || 'โปรดลองใหม่');
    },
  });

  return { activities, createActivity, updateActivity, deleteActivity, joinActivity, leaveActivity, };
}