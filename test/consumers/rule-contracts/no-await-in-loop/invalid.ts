async function loadAll() {
  while (pending) {
    await load();
  }
}
