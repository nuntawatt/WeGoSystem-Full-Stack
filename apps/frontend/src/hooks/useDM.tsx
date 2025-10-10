// apps/frontend/src/hooks/useDM.ts
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_USERS } from '../lib/demoData';

type DMMessage = { from: string; to: string; text: string; at: number };

type DMContextValue = {
  meUid: string;
  isOpen: boolean;
  openPeer: { uid: string; name: string; avatar: string } | null;
  openDM: (peerUid: string) => void;
  closeDM: () => void;
  getMsgs: (peerUid?: string) => DMMessage[];
  sendTo: (peerUid: string, text: string) => void;
};

const DMContext = createContext<DMContextValue | null>(null);

// key สำหรับคู่สนทนา (a,b) -> a|b โดยเรียงอักขระเพื่อไม่ซ้ำสลับ
const dmKeyFor = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const DMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // สมมุติให้ me = 'me'
  const meUid = 'me';

  // เก็บข้อความทุกคู่แชทใน Map
  const storeRef = useRef<Map<string, DMMessage[]>>(new Map());

  const [openPeerUid, setOpenPeerUid] = useState<string | null>(null);

  const openPeer = useMemo(() => {
    if (!openPeerUid) return null;
    return DEMO_USERS.find((u) => u.uid === openPeerUid) || null;
  }, [openPeerUid]);

  const getMsgs = (peerUidArg?: string) => {
    const peerUid = peerUidArg ?? openPeerUid;
    if (!peerUid) return [];
    const key = dmKeyFor(meUid, peerUid);
    return storeRef.current.get(key) ?? [];
  };

  const sendTo = (peerUid: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    const key = dmKeyFor(meUid, peerUid);
    const arr = storeRef.current.get(key) ?? [];
    arr.push({ from: meUid, to: peerUid, text: t, at: Date.now() });
    storeRef.current.set(key, arr);
    // กระตุ้นให้รีเรนเดอร์: เปลี่ยน state แบบเล็กน้อย
    setOpenPeerUid((uid) => (uid ? `${uid}` : uid));
  };

  const openDM = (peerUid: string) => setOpenPeerUid(peerUid);
  const closeDM = () => setOpenPeerUid(null);

  const value: DMContextValue = {
    meUid,
    isOpen: !!openPeerUid,
    openPeer,
    openDM,
    closeDM,
    getMsgs,
    sendTo,
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
};

export const useDM = () => {
  const ctx = useContext(DMContext);
  if (!ctx) throw new Error('useDM must be used within DMProvider');
  return ctx;
};
