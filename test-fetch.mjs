const supabaseUrl = 'https://shluyjyhbrttwqfriemc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobHV5anloYnJ0dHdxZnJpZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzQ1MjYsImV4cCI6MjA5MDU1MDUyNn0.s4XYhgeP2dhRAduY8oHYhDJW0tLlqxt2dSdX7sS6mmg';

console.log('Testing Supabase API connectivity...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

fetch(`${supabaseUrl}/rest/v1/deal_forensics?select=type,date_first_asked&limit=1`, {
  headers: {
    'apikey': supabaseAnonKey,
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries([...res.headers.entries()].filter(([k]) => k.toLowerCase().includes('content'))));
  return res.json();
})
.then(data => {
  console.log('Data received:', data);
  console.log('Record count:', Array.isArray(data) ? data.length : 'N/A');
})
.catch(err => {
  console.error('Error:', err.message);
});
