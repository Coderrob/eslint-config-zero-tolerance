async function retry() {
  while (pending) {
    await attempt();
  }
}
