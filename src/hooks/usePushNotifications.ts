import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const { data: isSubscribed, isLoading: isCheckingSubscription } = useQuery({
    queryKey: ['push-subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);
      return data && data.length > 0;
    },
    enabled: !!user?.id && isSupported,
  });

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!user?.id || !isSupported) throw new Error('Not supported');
      if (!VAPID_PUBLIC_KEY) throw new Error('VAPID key not configured');
      
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionJson = subscription.toJSON();
      
      // Get user's workspace
      const { data: membership } = await supabase
        .from('memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();
      
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        workspace_id: membership?.workspace_id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: 'endpoint' });
      
      return subscription;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-subscription'] }),
  });

  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) await subscription.unsubscribe();
      
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-subscription'] }),
  });

  return { 
    isSupported, 
    permission, 
    isSubscribed: !!isSubscribed, 
    isCheckingSubscription,
    subscribe, 
    unsubscribe 
  };
}
