const fetch = globalThis.fetch;

const projectId = 'zhfpzewpqzvkpbfmudfa';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZnB6ZXdwcXp2a3BiZm11ZGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDAxNDYsImV4cCI6MjA3ODAxNjE0Nn0.fy2AGk8_JIDHy755T_RVJ_NBoQ9JvVMo3IA80iBNNd0';

async function run() {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stats`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log(text);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

run();
