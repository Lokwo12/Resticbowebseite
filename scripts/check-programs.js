const fetch = globalThis.fetch;

const projectId = 'zhfpzewpqzvkpbfmudfa';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZnB6ZXdwcXp2a3BiZm11ZGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDAxNDYsImV4cCI6MjA3ODAxNjE0Nn0.fy2AGk8_JIDHy755T_RVJ_NBoQ9JvVMo3IA80iBNNd0';

(async () => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });

    const json = await response.json();
    console.log('Status:', response.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (error) {
    console.error('Request failed:', error);
    process.exitCode = 1;
  }
})();
