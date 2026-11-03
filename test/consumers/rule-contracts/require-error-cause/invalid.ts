try {
  work();
} catch (error) {
  const options = { cause: error };
  options!.cause = other;
  throw new Error('failed', options);
}
