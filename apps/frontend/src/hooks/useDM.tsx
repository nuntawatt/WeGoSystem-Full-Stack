// apps/frontend/src/hooks/useDM.ts
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_USERS } from '../lib/demoData';

type DMMessage = { from: string; to: string; text: string; at: number };

type PeerMeta = { uid: string; name: string; avatar?: string };

type DMContextValue = {
  meUid: string;
  isOpen: boolean;
  openPeer: PeerMeta | null;
  // openDM accepts either a uid string or a PeerMeta object
  openDM: (peer: string | PeerMeta) => void;
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

  // peers map stores metadata for known peers (initialize from DEMO_USERS)
  const peersRef = useRef<Map<string, PeerMeta>>(new Map(DEMO_USERS.map(u => [u.uid, { uid: u.uid, name: u.name, avatar: u.avatar }])));

  const [openPeerUid, setOpenPeerUid] = useState<string | null>(null);

  const openPeer = useMemo(() => {
    if (!openPeerUid) return null;
    return peersRef.current.get(openPeerUid) ?? null;
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

  const openDM = (peer: string | PeerMeta) => {
    if (typeof peer === 'string') {
      setOpenPeerUid(peer);
      return;
    }
    // store peer metadata and open
    peersRef.current.set(peer.uid, peer);
    setOpenPeerUid(peer.uid);
  };
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
