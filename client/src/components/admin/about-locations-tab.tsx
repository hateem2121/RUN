import type { AboutMapLocation } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Download, Edit, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CustomDropdown } from "@/components/admin/CustomDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogFooter, EnhancedDialogHeader, EnhancedDialogTitle } from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function AboutLocationsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AboutMapLocation | null>(null);
  const [activeTab, setActiveTab] = useState<'client' | 'facility'>('facility');
  const [formData, setFormData] = useState({
    type: 'facility' as 'client' | 'facility',
    name: "",
    latitude: 0,
    longitude: 0,
    country: "",
    city: "",
    details: "",
    isActive: true
  });

  const { data: locations = [], isLoading } = useQuery<AboutMapLocation[]>({
    queryKey: ['/api/about-locations'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/about-locations', { method: 'POST', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-locations'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Location added successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add location", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/about-locations/${id}`, { method: 'PATCH', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-locations'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Location updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update location", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/about-locations/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-locations'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Location deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" });
    },
  });

  const handleEdit = (location: AboutMapLocation) => {
    setEditingLocation(location);
    setFormData({
      type: (location.type as 'client' | 'facility') || 'facility',
      name: location.name,
      latitude: parseFloat(location.latitude?.toString() || '0'),
      longitude: parseFloat(location.longitude?.toString() || '0'),
      country: location.country || "",
      city: location.city || "",
      details: location.details || "",
      isActive: location.isActive !== false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({
      type: 'facility',
      name: "",
      latitude: 0,
      longitude: 0,
      country: "",
      city: "",
      details: "",
      isActive: true
    });
  };

  const exportLocations = () => {
    const data = locations.map(loc => ({
      type: loc.type,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      country: loc.country,
      city: loc.city,
      details: loc.details
    }));

    const csv = [
      'Type,Name,Latitude,Longitude,Country,City,Details',
      ...data.map(row =>
        `${row.type},${row.name},${row.latitude},${row.longitude},${row.country},${row.city || ''},${row.details || ''}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locations.csv';
    a.click();
  };

  const facilityLocations = locations.filter(loc => loc.type === 'facility');
  const clientLocations = locations.filter(loc => loc.type === 'client');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Global Presence</CardTitle>
              <CardDescription>
                Manage manufacturing facilities and client locations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportLocations}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="facility">
                <Building2 className="h-4 w-4 mr-2" />
                Manufacturing Facilities ({facilityLocations.length})
              </TabsTrigger>
              <TabsTrigger value="client">
                <MapPin className="h-4 w-4 mr-2" />
                Client Locations ({clientLocations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="facility" className="mt-4">
              {facilityLocations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No manufacturing facilities added yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {facilityLocations.map((location) => (
                    <div key={location.id} className="bg-white dark:bg-gray-950 border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{location.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {location.city ? `${location.city}, ` : ''}{location.country}
                          </p>
                          {location.details && (
                            <p className="text-sm text-gray-500 mt-1">{location.details}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Coordinates: {location.latitude}, {location.longitude}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(location)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(location.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="client" className="mt-4">
              {clientLocations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No client locations added yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {clientLocations.map((location) => (
                    <div key={location.id} className="bg-white dark:bg-gray-950 border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{location.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {location.city ? `${location.city}, ` : ''}{location.country}
                          </p>
                          {location.details && (
                            <p className="text-sm text-gray-500 mt-1">{location.details}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Coordinates: {location.latitude}, {location.longitude}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(location)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(location.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EnhancedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {editingLocation ? "Edit Location" : "Add Location"}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>

          <div className="space-y-4">
            <CustomDropdown
              value={formData.type}
              onChange={(value) => {
                setFormData({ ...formData, type: value as 'client' | 'facility' });
              }}
              options={[
                { value: "facility", label: "Manufacturing Facility" },
                { value: "client", label: "Client Location" }
              ]}
              label="Location Type"
              placeholder="Select location type"
              required={true}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.type === 'facility' ? "Main Production Facility" : "Nike Corporation"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Sri Lanka"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Colombo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Details (Optional)</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder={formData.type === 'facility' ? "50,000 sq ft facility with 500+ employees" : "Major sportswear brand partner since 2010"}
                rows={3}
              />
            </div>
          </div>

          <EnhancedDialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.country}>
              {editingLocation ? "Update" : "Add"}
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>
    </div>
  );
}