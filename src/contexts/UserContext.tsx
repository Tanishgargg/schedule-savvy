// src/contexts/UserContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/api';
import { User } from '@/types';

interface UserContextType {
    user: User | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, isLoading: true });

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: getCurrentUser,
    });

    return (
        <UserContext.Provider value={{ user: user || null, isLoading }}>
    {children}
    </UserContext.Provider>
);
};

export const useUser = () => useContext(UserContext);