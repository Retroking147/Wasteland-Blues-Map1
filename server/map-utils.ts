import { Location } from "@shared/schema";

export interface Coordinates {
  x: number;
  y: number;
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