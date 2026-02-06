import { AppData } from '../types';
import { supabase } from './supabaseClient';

const APP_STATE_ID = 'colombia1';

export const fetchAppState = async (): Promise<AppData | null> => {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', APP_STATE_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.data as AppData) || null;
};

export const upsertAppState = async (state: AppData): Promise<void> => {
  const { error } = await supabase.from('app_state').upsert({
    id: APP_STATE_ID,
    data: state,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }
};
