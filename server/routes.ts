import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLocationSchema, insertVendorSchema, insertRoadSchema, locationEditorSchema } from "@shared/schema";
import { z } from "zod";
import { generateRoadPath } from "./map-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware for admin routes
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (!req.session?.isAdmin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };
  
  // Get published map data for public interface
  app.get("/api/map/public", async (req, res) => {
    try {
      const mapData = await storage.getPublishedMapData();
      res.json(mapData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public map data" });
    }
  });

  // Get all map data for admin interface
  app.get("/api/map/admin", requireAdminAuth, async (req, res) => {
    try {
      const mapData = await storage.getAdminMapData();
      res.json(mapData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin map data" });
    }
  });

  // Verify admin code and create session
  app.post("/api/admin/verify", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Admin code is required" });
      }

      const isValid = await storage.verifyAdminCode(code);
      if (isValid) {
        (req as any).session.isAdmin = true;
      }
      res.json({ isValid });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin code" });
    }
  });

  // Publish all changes to public map
  app.post("/api/admin/publish", requireAdminAuth, async (req, res) => {
    try {
      await storage.publishAllChanges();
      res.json({ message: "All changes published successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to publish changes" });
    }
  });

  // Location CRUD operations
  app.get("/api/locations", requireAdminAuth, async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", requireAdminAuth, async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = locationEditorSchema.parse(req.body);
      const { vendors, ...locationData } = validatedData;
      
      const location = await storage.createLocation(locationData);
      
      // Create associated vendors if provided
      if (vendors && vendors.length > 0) {
        for (const vendor of vendors) {
          await storage.createVendor({ ...vendor, locationId: location.id });
        }
      }
      
      const locationWithVendors = await storage.getLocation(location.id);
      res.status(201).json(locationWithVendors);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = locationEditorSchema.parse(req.body);
      const { vendors, ...locationData } = validatedData;
      
      const location = await storage.updateLocation(req.params.id, locationData);
      
      // Update vendors - for simplicity, delete all and recreate
      const existingVendors = await storage.getVendorsByLocation(req.params.id);
      for (const vendor of existingVendors) {
        await storage.deleteVendor(vendor.id);
      }
      
      if (vendors && vendors.length > 0) {
        for (const vendor of vendors) {
          await storage.createVendor({ ...vendor, locationId: location.id });
        }
      }
      
      const locationWithVendors = await storage.getLocation(location.id);
      res.json(locationWithVendors);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.json({ message: "Location deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Road CRUD operations
  app.get("/api/roads", requireAdminAuth, async (req, res) => {
    try {
      const roads = await storage.getRoads();
      res.json(roads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roads" });
    }
  });

  app.post("/api/roads", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertRoadSchema.parse(req.body);
      
      // Get location coordinates to generate path data
      const fromLocation = await storage.getLocation(validatedData.fromLocationId);
      const toLocation = await storage.getLocation(validatedData.toLocationId);
      
      if (!fromLocation || !toLocation) {
        return res.status(400).json({ message: "One or both locations not found" });
      }
      
      // Generate path data if not provided
      const pathData = validatedData.pathData || generateRoadPath(
        { x: fromLocation.x, y: fromLocation.y },
        { x: toLocation.x, y: toLocation.y }
      );
      
      const road = await storage.createRoad({
        ...validatedData,
        pathData
      });
      res.status(201).json(road);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid road data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create road" });
    }
  });

  app.delete("/api/roads/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deleteRoad(req.params.id);
      res.json({ message: "Road deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete road" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
