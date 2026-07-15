import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Dashboard } from '../components/lobby/Dashboard';
import { SessionCard } from '../components/lobby/SessionCard';
import { CreateSession } from '../components/lobby/CreateSession';
import { JoinSession } from '../components/lobby/JoinSession';
import { api } from '../services/api';
import type { IRoom } from '../../../shared/types/index';

export default function LobbyPage(): React.ReactElement {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    void api.get<IRoom[]>('/rooms').then(setRooms).catch(() => {});
  }, []);

  return (
    <AppShell>
      <Dashboard
        onCreateSession={() => setCreateOpen(true)}
        onJoinSession={() => setJoinOpen(true)}
      >
        {rooms.map((room) => (
          <SessionCard key={room._id} room={room} />
        ))}
      </Dashboard>

      <CreateSession isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinSession isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </AppShell>
  );
}
