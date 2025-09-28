import { useState } from 'react';
import { login, setAuthToken, createRoom, getRoom } from '../api';

type Props = {
    onAuthenticated: (token: string, username: string) => void;
    onEnterRoom: (roomCode: string, asGuest: boolean) => void;
};

export default function Login({ onAuthenticated, onEnterRoom }: Props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const res = await login(username, password);
            setAuthToken(res.token);
            onAuthenticated(res.token, res.user.username);

            // Immediately prompt to create a room and navigate into it
            const name = prompt('Room name to create:');
            if (name) {
                const room = await createRoom(name);
                onEnterRoom(room.code, false);
            }
        } catch (err: any) {
            alert('Sign in failed: ' + (err?.response?.data?.error || err.message));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Room creation is handled immediately after successful sign-in

    const handleGuestEnter = async () => {
        if (!roomCode) return alert('Enter a room code');
        // Verify room exists
        setLoading(true);
        try {
            const room = await getRoom(roomCode);
            if (!room) return alert('Room not found');
            onEnterRoom(roomCode, true);
        } catch (err) {
            alert('Room not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-6 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">Sign in or continue as guest</h1>

                <div className="space-y-3">
                    <input className="w-full border px-3 py-2 rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={handleSignIn} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Signing in...' : 'Sign in'}</button>

                    <div className="my-2 text-center text-gray-400">or</div>

                    <div className="flex space-x-2">
                        <input className="flex-1 border px-3 py-2 rounded" placeholder="Enter room code" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
                        <button onClick={handleGuestEnter} className="bg-gray-200 px-4 rounded">Guest</button>
                    </div>

                    {/* Room creation is only available via the Sign in flow */}
                </div>
            </div>
        </div>
    );
}
