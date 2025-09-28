import { useEffect, useState } from 'react';
import { getRoom, setAuthToken } from '../api';
import { QueueEntry } from '../types';

type Props = {
    roomCode: string;
    token: string | null;
    asGuest: boolean;
    onLeave: () => void;
};

export default function RoomView({ roomCode, token, asGuest, onLeave }: Props) {
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (token) setAuthToken(token);
            try {
                const r = await getRoom(roomCode);
                setRoom(r);
            } catch (err) {
                console.error('Failed to load room', err);
                setRoom(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [roomCode, token]);

    if (loading) return <div className="p-6">Loading room...</div>;
    if (!room) return <div className="p-6">Room not found</div>;

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Room: {room.name} ({room.code})</h2>
                <div>
                    <button onClick={onLeave} className="px-3 py-1 border rounded">Leave</button>
                </div>
            </div>

            <div>
                <p className="text-sm text-gray-600">Created by: {room.createdBy}</p>
                <div className="mt-4">
                    {room.queue && room.queue.length === 0 && <p className="text-gray-500">No students in queue</p>}
                    {room.queue && room.queue.map((entry: QueueEntry, i: number) => (
                        <div key={entry.student.id} className="p-3 border-b">
                            <strong>#{i + 1}</strong> {entry.student.displayName} {entry.student.topic && <>- {entry.student.topic}</>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

