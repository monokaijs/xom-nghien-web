"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TournamentRegistrationProps {
  tournamentId: number;
  userRegistration: { team_number: number } | null | undefined;
  isRegistrationOpen: boolean;
  team1Full: boolean;
  team2Full: boolean;
}

export default function TournamentRegistration({
  tournamentId,
  userRegistration,
  isRegistrationOpen,
  team1Full,
  team2Full,
}: TournamentRegistrationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [registering, setRegistering] = useState(false);

  const handleRegister = async (teamNumber: number) => {
    if (!session?.user) {
      alert('Vui lòng đăng nhập để đăng ký');
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_number: teamNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đăng ký thành công!');
        router.refresh();
      } else {
        alert(data.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Đã xảy ra lỗi khi đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!session?.user) return;

    if (!confirm('Bạn có chắc muốn hủy đăng ký?')) return;

    try {
      setRegistering(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Hủy đăng ký thành công!');
        router.refresh();
      } else {
        alert(data.error || 'Hủy đăng ký thất bại');
      }
    } catch (error) {
      console.error('Error unregistering:', error);
      alert('Đã xảy ra lỗi khi hủy đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
        <p className="text-white/60 mb-4">Vui lòng đăng nhập để đăng ký tham gia giải đấu</p>
        <a
          href="/api/auth/signin"
          className="inline-block bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-2 rounded-xl transition-colors"
        >
          Đăng Nhập
        </a>
      </div>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20 text-center">
        <p className="text-red-400">Đã hết hạn đăng ký</p>
      </div>
    );
  }

  if (userRegistration) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
        <p className="text-white mb-4">
          Bạn đã đăng ký cho <span className="text-accent-primary font-bold">Đội {userRegistration.team_number}</span>
        </p>
        <button
          onClick={handleUnregister}
          disabled={registering}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {registering ? 'Đang xử lý...' : 'Hủy Đăng Ký'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold mb-4 text-center">Đăng Ký Tham Gia</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleRegister(1)}
          disabled={registering || team1Full}
          className="bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {team1Full ? 'Đội 1 Đầy' : 'Đăng Ký Đội 1'}
        </button>
        <button
          onClick={() => handleRegister(2)}
          disabled={registering || team2Full}
          className="bg-accent-primary hover:bg-accent-primary/80 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {team2Full ? 'Đội 2 Đầy' : 'Đăng Ký Đội 2'}
        </button>
      </div>
    </div>
  );
}

