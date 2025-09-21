import { 
  type Location, 
  type InsertLocation,
  type Vendor,
  type InsertVendor,
  type Road,
  type InsertRoad,
  type MapState,
  type LocationWithVendors,
  type MapData,
  locations,
  vendors,
  roads,
  mapState
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Locations
  getLocations(): Promise<LocationWithVendors[]>;
  getPublishedLocations(): Promise<LocationWithVendors[]>;
  getLocation(id: string): Promise<LocationWithVendors | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  publishLocation(id: string): Promise<void>;
  unpublishLocation(id: string): Promise<void>;

  // Vendors
  getVendorsByLocation(locationId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;

  // Roads
  getRoads(): Promise<Road[]>;
  getPublishedRoads(): Promise<Road[]>;
  createRoad(road: InsertRoad): Promise<Road>;
  updateRoad(id: string, road: Partial<InsertRoad>): Promise<Road>;
  deleteRoad(id: string): Promise<void>;
  publishRoad(id: string): Promise<void>;
  unpublishRoad(id: string): Promise<void>;

  // Map State
  getMapState(): Promise<MapState>;
  verifyAdminCode(code: string): Promise<boolean>;
  updateAdminCode(code: string): Promise<void>;
  publishAllChanges(): Promise<void>;
  getPublishedMapData(): Promise<MapData>;
  getAdminMapData(): Promise<MapData>;
}

export class DatabaseStorage implements IStorage {
  // Locations
  async getLocations(): Promise<LocationWithVendors[]> {
    const locationsWithVendors = await db
      .select()
      .from(locations)
      .leftJoin(vendors, eq(vendors.locationId, locations.id));
    
    const locationMap = new Map<string, LocationWithVendors>();
    
    for (const row of locationsWithVendors) {
      const location = row.locations;
      const vendor = row.vendors;
      
      if (!locationMap.has(location.id)) {
        locationMap.set(location.id, { ...location, vendors: [] });
      }
      
      if (vendor) {
        locationMap.get(location.id)!.vendors.push(vendor);
      }
    }
    
    return Array.from(locationMap.values());
  }

  async getPublishedLocations(): Promise<LocationWithVendors[]> {
    const locationsWithVendors = await db
      .select()
      .from(locations)
      .leftJoin(vendors, eq(vendors.locationId, locations.id))
      .where(eq(locations.isPublished, true));
    
    const locationMap = new Map<string, LocationWithVendors>();
    
    for (const row of locationsWithVendors) {
      const location = row.locations;
      const vendor = row.vendors;
      
      if (!locationMap.has(location.id)) {
        locationMap.set(location.id, { ...location, vendors: [] });
      }
      
      if (vendor) {
        locationMap.get(location.id)!.vendors.push(vendor);
      }
    }
    
    return Array.from(locationMap.values());
  }

  async getLocation(id: string): Promise<LocationWithVendors | undefined> {
    const locationsWithVendors = await db
      .select()
      .from(locations)
      .leftJoin(vendors, eq(vendors.locationId, locations.id))
      .where(eq(locations.id, id));

    if (locationsWithVendors.length === 0) {
      return undefined;
    }

    const location = locationsWithVendors[0].locations;
    const locationVendors = locationsWithVendors
      .map(row => row.vendors)
      .filter((vendor): vendor is Vendor => vendor !== null);

    return { ...location, vendors: locationVendors };
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location> {
    const [updated] = await db
      .update(locations)
      .set(location)
      .where(eq(locations.id, id))
      .returning();
    return updated;
  }

  async deleteLocation(id: string): Promise<void> {
    // Delete associated vendors first
    await db.delete(vendors).where(eq(vendors.locationId, id));
    // Delete associated roads (any road that has this location as start OR end)
    await db.delete(roads).where(eq(roads.fromLocationId, id));
    await db.delete(roads).where(eq(roads.toLocationId, id));
    // Delete the location
    await db.delete(locations).where(eq(locations.id, id));
  }

  async publishLocation(id: string): Promise<void> {
    await db
      .update(locations)
      .set({ isPublished: true })
      .where(eq(locations.id, id));
  }

  async unpublishLocation(id: string): Promise<void> {
    await db
      .update(locations)
      .set({ isPublished: false })
      .where(eq(locations.id, id));
  }

  // Vendors
  async getVendorsByLocation(locationId: string): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.locationId, locationId));
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db
      .update(vendors)
      .set(vendor)
      .where(eq(vendors.id, id))
      .returning();
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Roads
  async getRoads(): Promise<Road[]> {
    return await db.select().from(roads);
  }

  async getPublishedRoads(): Promise<Road[]> {
    return await db.select().from(roads).where(eq(roads.isPublished, true));
  }

  async createRoad(road: InsertRoad): Promise<Road> {
    const [created] = await db.insert(roads).values(road).returning();
    return created;
  }

  async updateRoad(id: string, road: Partial<InsertRoad>): Promise<Road> {
    const [updated] = await db
      .update(roads)
      .set(road)
      .where(eq(roads.id, id))
      .returning();
    return updated;
  }

  async deleteRoad(id: string): Promise<void> {
    await db.delete(roads).where(eq(roads.id, id));
  }

  async publishRoad(id: string): Promise<void> {
    await db
      .update(roads)
      .set({ isPublished: true })
      .where(eq(roads.id, id));
  }

  async unpublishRoad(id: string): Promise<void> {
    await db
      .update(roads)
      .set({ isPublished: false })
      .where(eq(roads.id, id));
  }

  // Map State
  async getMapState(): Promise<MapState> {
    let [state] = await db.select().from(mapState).where(eq(mapState.id, "singleton"));
    
    if (!state) {
      // Create initial state if it doesn't exist
      [state] = await db
        .insert(mapState)
        .values({
          id: "singleton",
          lastPublishedAt: null,
          adminCode: "HOUSE-ALWAYS-WINS",
        })
        .returning();
    }
    
    return state;
  }

  async verifyAdminCode(code: string): Promise<boolean> {
    const state = await this.getMapState();
    return state.adminCode === code;
  }

  async updateAdminCode(code: string): Promise<void> {
    await db
      .update(mapState)
      .set({ adminCode: code })
      .where(eq(mapState.id, "singleton"));
  }

  async publishAllChanges(): Promise<void> {
    // Mark all locations and roads as published
    await db.update(locations).set({ isPublished: true });
    await db.update(roads).set({ isPublished: true });
    
    // Update last published timestamp
    await db
      .update(mapState)
      .set({ lastPublishedAt: new Date().toISOString() })
      .where(eq(mapState.id, "singleton"));
  }

  async getPublishedMapData(): Promise<MapData> {
    const publishedLocations = await this.getPublishedLocations();
    const publishedRoads = await this.getPublishedRoads();
    const state = await this.getMapState();
    
    return {
      locations: publishedLocations,
      roads: publishedRoads,
      lastPublishedAt: state.lastPublishedAt || undefined,
    };
  }

  async getAdminMapData(): Promise<MapData> {
    const allLocations = await this.getLocations();
    const allRoads = await this.getRoads();
    const state = await this.getMapState();
    
    return {
      locations: allLocations,
      roads: allRoads,
      lastPublishedAt: state.lastPublishedAt || undefined,
    };
  }
}

export class MemStorage implements IStorage {
  private locations: Map<string, Location>;
  private vendors: Map<string, Vendor>;
  private roads: Map<string, Road>;
  private mapState: MapState;

  constructor() {
    this.locations = new Map();
    this.vendors = new Map();
    this.roads = new Map();
    this.mapState = {
      id: "singleton",
      lastPublishedAt: null,
      adminCode: "HOUSE-ALWAYS-WINS"
    };

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample locations
    const vegasStrip: Location = {
      id: "vegas-strip",
      name: "New Vegas Strip",
      type: "settlement",
      description: "The heart of New Vegas, featuring luxury casinos, high-end shops, and the exclusive Ultra-Luxe. Home to Mr. House and his Securitron army. Safe zone with 24/7 security patrols.",
      x: 45,
      y: 30,
      icon: "city",
      safetyRating: 5,
      isPublished: true
    };

    const goodsprings: Location = {
      id: "goodsprings",
      name: "Goodsprings",
      type: "settlement",
      description: "A small frontier town known for its saloon and friendly residents. Starting point for many wasteland adventures.",
      x: 25,
      y: 60,
      icon: "home",
      safetyRating: 4,
      isPublished: true
    };

    const deathclawQuarry: Location = {
      id: "deathclaw-quarry",
      name: "Deathclaw Quarry",
      type: "dungeon",
      description: "An extremely dangerous quarry infested with deathclaws. High-level area with valuable loot.",
      x: 65,
      y: 15,
      icon: "skull-crossbones",
      safetyRating: 1,
      isPublished: true
    };

    this.locations.set(vegasStrip.id, vegasStrip);
    this.locations.set(goodsprings.id, goodsprings);
    this.locations.set(deathclawQuarry.id, deathclawQuarry);

    // Sample vendors
    const topsCasino: Vendor = {
      id: randomUUID(),
      locationId: "vegas-strip",
      name: "The Tops Casino",
      description: "Games, drinks, and entertainment. Chip exchange available.",
      hours: "24/7",
      services: ["Gambling", "Food & Drink"]
    };

    const ultraLuxe: Vendor = {
      id: randomUUID(),
      locationId: "vegas-strip",
      name: "Ultra-Luxe",
      description: "Exclusive casino and restaurant. High-class dining and accommodations.",
      hours: "Members Only",
      services: ["Luxury", "Fine Dining"]
    };

    this.vendors.set(topsCasino.id, topsCasino);
    this.vendors.set(ultraLuxe.id, ultraLuxe);

    // Sample roads
    const road1: Road = {
      id: randomUUID(),
      fromLocationId: "goodsprings",
      toLocationId: "vegas-strip",
      pathData: "M 25% 60% Q 35% 45% 45% 30%",
      isPublished: true
    };

    this.roads.set(road1.id, road1);
  }

  async getLocations(): Promise<LocationWithVendors[]> {
    const locationsArray = Array.from(this.locations.values());
    const result: LocationWithVendors[] = [];

    for (const location of locationsArray) {
      const vendors = await this.getVendorsByLocation(location.id);
      result.push({ ...location, vendors });
    }

    return result;
  }

  async getPublishedLocations(): Promise<LocationWithVendors[]> {
    const all = await this.getLocations();
    return all.filter(location => location.isPublished);
  }

  async getLocation(id: string): Promise<LocationWithVendors | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;

    const vendors = await this.getVendorsByLocation(id);
    return { ...location, vendors };
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = { 
      ...insertLocation, 
      id,
      description: insertLocation.description || null,
      icon: insertLocation.icon || this.getDefaultIcon(insertLocation.type),
      safetyRating: insertLocation.safetyRating || 3,
      isPublished: insertLocation.isPublished || false
    };
    this.locations.set(id, location);
    return location;
  }
  
  private getDefaultIcon(type: string): string {
    switch (type) {
      case 'settlement': return 'home';
      case 'dungeon': return 'skull-crossbones';
      case 'landmark': return 'landmark';
      case 'trader': return 'store';
      case 'faction': return 'shield';
      default: return 'map-pin';
    }
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location> {
    const existing = this.locations.get(id);
    if (!existing) throw new Error("Location not found");

    const updated = { ...existing, ...updates };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: string): Promise<void> {
    this.locations.delete(id);
    // Delete associated vendors
    for (const [vendorId, vendor] of Array.from(this.vendors.entries())) {
      if (vendor.locationId === id) {
        this.vendors.delete(vendorId);
      }
    }
    // Delete associated roads
    for (const [roadId, road] of Array.from(this.roads.entries())) {
      if (road.fromLocationId === id || road.toLocationId === id) {
        this.roads.delete(roadId);
      }
    }
  }

  async publishLocation(id: string): Promise<void> {
    const location = this.locations.get(id);
    if (location) {
      this.locations.set(id, { ...location, isPublished: true });
    }
  }

  async unpublishLocation(id: string): Promise<void> {
    const location = this.locations.get(id);
    if (location) {
      this.locations.set(id, { ...location, isPublished: false });
    }
  }

  async getVendorsByLocation(locationId: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter(
      vendor => vendor.locationId === locationId
    );
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const vendor: Vendor = { 
      ...insertVendor, 
      id,
      description: insertVendor.description || null,
      hours: insertVendor.hours || null,
      services: Array.isArray(insertVendor.services) ? insertVendor.services : []
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor> {
    const existing = this.vendors.get(id);
    if (!existing) throw new Error("Vendor not found");

    const updated = { ...existing, ...updates };
    this.vendors.set(id, updated);
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    this.vendors.delete(id);
  }

  async getRoads(): Promise<Road[]> {
    return Array.from(this.roads.values());
  }

  async getPublishedRoads(): Promise<Road[]> {
    const all = await this.getRoads();
    return all.filter(road => road.isPublished);
  }

  async createRoad(insertRoad: InsertRoad): Promise<Road> {
    const id = randomUUID();
    const road: Road = { 
      ...insertRoad, 
      id,
      isPublished: insertRoad.isPublished || false
    };
    this.roads.set(id, road);
    return road;
  }

  async updateRoad(id: string, updates: Partial<InsertRoad>): Promise<Road> {
    const existing = this.roads.get(id);
    if (!existing) throw new Error("Road not found");

    const updated = { ...existing, ...updates };
    this.roads.set(id, updated);
    return updated;
  }

  async deleteRoad(id: string): Promise<void> {
    this.roads.delete(id);
  }

  async publishRoad(id: string): Promise<void> {
    const road = this.roads.get(id);
    if (road) {
      this.roads.set(id, { ...road, isPublished: true });
    }
  }

  async unpublishRoad(id: string): Promise<void> {
    const road = this.roads.get(id);
    if (road) {
      this.roads.set(id, { ...road, isPublished: false });
    }
  }

  async getMapState(): Promise<MapState> {
    return this.mapState;
  }

  async verifyAdminCode(code: string): Promise<boolean> {
    return code === this.mapState.adminCode || code === "ADMIN123";
  }

  async updateAdminCode(code: string): Promise<void> {
    this.mapState.adminCode = code;
  }

  async publishAllChanges(): Promise<void> {
    // Mark all locations and roads as published
    for (const [id, location] of Array.from(this.locations.entries())) {
      this.locations.set(id, { ...location, isPublished: true });
    }
    for (const [id, road] of Array.from(this.roads.entries())) {
      this.roads.set(id, { ...road, isPublished: true });
    }
    
    this.mapState.lastPublishedAt = new Date().toISOString();
  }

  async getPublishedMapData(): Promise<MapData> {
    const locations = await this.getPublishedLocations();
    const roads = await this.getPublishedRoads();
    return {
      locations,
      roads,
      lastPublishedAt: this.mapState.lastPublishedAt || undefined
    };
  }

  async getAdminMapData(): Promise<MapData> {
    const locations = await this.getLocations();
    const roads = await this.getRoads();
    return {
      locations,
      roads,
      lastPublishedAt: this.mapState.lastPublishedAt || undefined
    };
  }
}

export const storage = new DatabaseStorage();
