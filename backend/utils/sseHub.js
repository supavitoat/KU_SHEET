// Simple in-memory SSE hub for broadcasting events per group
const hubs = new Map(); // groupId -> Set<res>

function getSet(groupId) {
  const id = Number(groupId);
  let set = hubs.get(id);
  if (!set) {
    set = new Set();
    hubs.set(id, set);
  }
  return set;
}

function register(groupId, res) {
  const set = getSet(groupId);
  set.add(res);
  return () => {
    try { set.delete(res); } catch {}
  };
}

function broadcast(groupId, event, dataObj) {
  const set = hubs.get(Number(groupId));
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\n` +
                  `data: ${JSON.stringify(dataObj)}\n\n`;
  for (const res of Array.from(set)) {
    try {
      res.write(payload);
    } catch (e) {
      try { set.delete(res); } catch {}
    }
  }
}

function ping(groupId) {
  broadcast(groupId, 'ping', { t: Date.now() });
}

module.exports = { register, broadcast, ping };
