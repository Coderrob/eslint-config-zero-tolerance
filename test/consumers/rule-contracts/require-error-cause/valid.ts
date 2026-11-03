try {
  work();
} catch (error) {
  const original = error;
  error = other;
  throw new Error('failed', { cause: original });
}
