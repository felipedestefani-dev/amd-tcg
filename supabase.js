/* Chave anon é pública. A service_role nunca entra aqui. */
window.AMD_SB = {
  readConfig() {
    return {
      url: (localStorage.getItem("amd.sb.url") || "https://ynifimqhiyjckpnnstzi.supabase.co").trim(),
      anonKey: (localStorage.getItem("amd.sb.key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaWZpbXFoaXlqY2twbm5zdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTIxMDgsImV4cCI6MjEwODY2ODEwOH0.6OfUbx0ASnFafoYiQfW5dqcnYotlSUnyuuSiut5soPA").trim(),
    };
  },
  saveConfig(url, anonKey) {
    localStorage.setItem("amd.sb.url", String(url || "").trim());
    localStorage.setItem("amd.sb.key", String(anonKey || "").trim());
  },
  async client() {
    const { url, anonKey } = this.readConfig();
    if (!url || !anonKey) return null;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    return createClient(url, anonKey);
  },
};
