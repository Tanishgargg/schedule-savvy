import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/api';
import { User } from '@/types';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
