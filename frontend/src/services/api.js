const API_BASE = '/api';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getDrivers() {
  return fetchJson(`${API_BASE}/drivers`);
}

export async function getUpcomingRaces() {
  return fetchJson(`${API_BASE}/races/upcoming`);
}

export async function getAllEvents() {
  return fetchJson(`${API_BASE}/races/all`);
}

export async function getLastRaceResult() {
  const response = await fetch(`${API_BASE}/races/results`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
}

export async function getChampionshipInfo() {
  return fetchJson(`${API_BASE}/championship`);
}
