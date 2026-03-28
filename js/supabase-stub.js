// Loaded when Supabase CDN is unavailable or keys are not set.
// Provides a no-op stub so the rest of the code doesn't crash.
if (typeof supabase === 'undefined') {
  window.supabase = {
    createClient: () => ({
      from: () => ({ select: () => ({}), insert: () => ({}), update: () => ({}), delete: () => ({}) }),
      auth: { signInWithPassword: async () => { throw new Error('No Supabase'); }, signOut: async () => {}, getSession: async () => ({ data: { session: null } }) },
      storage: { from: () => ({ upload: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    })
  };
}
