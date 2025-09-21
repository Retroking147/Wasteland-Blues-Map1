import type { LocationWithVendors } from "@shared/schema";

export interface Coordinates {
  x: number;
  y: number;
}

export function getLocationIcon(type: string): string {
  switch (type) {
    case 'settlement':
      return 'home';
    case 'dungeon':
      return 'skull-crossbones';
    case 'landmark':
      return 'landmark';
    case 'trader':
      return 'store';
    case 'faction':
      return 'shield';
    default:
      return 'map-pin';
  }
}

export function getLocationColor(type: string): string {
  switch (type) {
    case 'settlement':
      return 'var(--accent)';
    case 'dungeon':
      return 'var(--destructive)';
    case 'landmark':
      return 'var(--secondary)';
    case 'trader':
      return 'var(--primary)';
    case 'faction':
      return 'var(--primary)';
    default:
      return 'var(--muted-foreground)';
  }
}

export function getSafetyRatingColor(rating: number): string {
  if (rating >= 4) return 'var(--accent)';
  if (rating >= 3) return 'var(--primary)';
  if (rating >= 2) return 'var(--secondary)';
  return 'var(--destructive)';
}

export function getSafetyRatingText(rating: number): string {
  switch (rating) {
    case 5:
      return 'VERY SAFE';
    case 4:
      return 'SAFE';
    case 3:
      return 'MODERATE';
    case 2:
      return 'DANGEROUS';
    case 1:
      return 'EXTREMELY DANGEROUS';
    default:
      return 'UNKNOWN';
  }
}

export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateRoadPath(from: Coordinates, to: Coordinates): string {
  // Generate a curved SVG path between two points
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Add some curve to make it look more natural
  const offset = Math.min(20, calculateDistance(from, to) / 4);
  const controlX = midX + (Math.random() - 0.5) * offset;
  const controlY = midY + (Math.random() - 0.5) * offset;
  
  return `M ${from.x}% ${from.y}% Q ${controlX}% ${controlY}% ${to.x}% ${to.y}%`;
}

export function convertScreenToMapCoordinates(
  screenX: number,
  screenY: number,
  containerRect: DOMRect,
  zoomLevel: number,
  centerX: number,
  centerY: number
): Coordinates {
  const relativeX = (screenX - containerRect.left) / containerRect.width;
  const relativeY = (screenY - containerRect.top) / containerRect.height;
  
  const zoomFactor = zoomLevel / 100;
  const x = centerX + (relativeX - 0.5) * 100 / zoomFactor;
  const y = centerY + (relativeY - 0.5) * 100 / zoomFactor;
  
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

export function isValidLocationPlacement(
  coordinates: Coordinates,
  existingLocations: LocationWithVendors[],
  minDistance: number = 5
): boolean {
  return existingLocations.every(location => {
    const distance = calculateDistance(coordinates, { x: location.x, y: location.y });
    return distance >= minDistance;
  });
}
