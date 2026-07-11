export const defaultCoordination = [25.0628, 121.5193]; // Minquan West Rd Station
export const NEAR = 0.2; // km

export function inRange(coord1, coord2, range = 0.5) {
  if (!coord1 || !coord2) return false;
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; 
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return distance <= range;
}

export function getPosition(coordinates) {
  if (!coordinates) return defaultCoordination;
  let coo = String(coordinates).split(',');
  let ret = [parseFloat(coo[0]), parseFloat(coo[1])];
  if (isNaN(ret[0]) || isNaN(ret[1])) return defaultCoordination;
  return ret;
}
