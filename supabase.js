/* Chave anon é pública. A service_role nunca entra aqui. O endereço não vem do navegador. */
window.AMD_SB = {
  readConfig() {
    return {
      url: "https://ynifimqhiyjckpnnstzi.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaWZpbXFoaXlqY2twbm5zdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTIxMDgsImV4cCI6MjEwODY2ODEwOH0.6OfUbx0ASnFafoYiQfW5dqcnYotlSUnyuuSiut5soPA",
    };
  },
  async client() {
    const { url, anonKey } = this.readConfig();
    if (!url || !anonKey) return null;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    return createClient(url, anonKey);
  },
};
