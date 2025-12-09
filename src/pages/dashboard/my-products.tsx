import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, ShoppingCart, MapPin, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product, BusinessProduct } from "@/types/product";
import { fetchAllProducts } from "@/lib/products-api";

interface BusinessProductWithDetails extends BusinessProduct {
  product?: Product;
}

const MyProductsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<{ id: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<BusinessProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BusinessProductWithDetails | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    price_override: "",
    quantity: "",
    location_note: "",
    best_buy_note: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchBusiness();
    }
  }, [user]);

  useEffect(() => {
    if (business) {
      fetchAvailableProducts();
      fetchMyProducts();
    }
  }, [business]);

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setBusiness(data);
      }
    } catch (error: any) {
      console.error("Error fetching business:", error);
      toast({
        title: "Error",
        description: "Failed to load business information.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const products = await fetchAllProducts();
      setAvailableProducts(products);
    } catch (error: any) {
      console.error("Error fetching available products:", error);
      toast({
        title: "Error",
        description: "Failed to load available products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    if (!business) return;

    try {
      const { data, error } = await supabase
        .from("business_products")
        .select(
          `
          id,
          business_id,
          product_id,
          price_override,
          quantity,
          location_note,
          best_buy_note,
          is_active,
          created_at,
          updated_at,
          product:products (
            id,
            title,
            description,
            price,
            image_url,
            slug
          )
        `
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMyProducts((data || []) as BusinessProductWithDetails[]);
    } catch (error: any) {
      console.error("Error fetching my products:", error);
      toast({
        title: "Error",
        description: "Failed to load your products.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct(null);
    setFormData({
      price_override: product.price?.toString() || "",
      quantity: "0",
      location_note: "",
      best_buy_note: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (businessProduct: BusinessProductWithDetails) => {
    setEditingProduct(businessProduct);
    setSelectedProduct(businessProduct.product || null);
    setFormData({
      price_override: businessProduct.price_override?.toString() || "",
      quantity: businessProduct.quantity?.toString() || "0",
      location_note: businessProduct.location_note || "",
      best_buy_note: businessProduct.best_buy_note || "",
      is_active: businessProduct.is_active !== undefined ? businessProduct.is_active : true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!business || !selectedProduct) return;

    const priceValue = parseFloat(formData.price_override);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProduct) {
        // Update existing business product
        const { error } = await supabase
          .from("business_products")
          .update({
            price_override: priceValue,
            quantity: formData.quantity ? parseInt(formData.quantity) : 0,
            location_note: formData.location_note || null,
            best_buy_note: formData.best_buy_note || null,
            is_active: formData.is_active,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully.",
        });
      } else {
        // Insert new business product
        const { error } = await supabase.from("business_products").insert({
          business_id: business.id,
          product_id: selectedProduct.id,
          price_override: priceValue,
          quantity: formData.quantity ? parseInt(formData.quantity) : 0,
          location_note: formData.location_note || null,
          best_buy_note: formData.best_buy_note || null,
          is_active: formData.is_active,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product added to your business successfully.",
        });
      }

      setIsDialogOpen(false);
      fetchMyProducts();
      fetchAvailableProducts(); // Refresh to update "Add" button states
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save product.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (businessProductId: string) => {
    if (!confirm("Are you sure you want to remove this product from your business?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("business_products")
        .delete()
        .eq("id", businessProductId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product removed successfully.",
      });

      fetchMyProducts();
      fetchAvailableProducts(); // Refresh to show "Add" button again
    } catch (error: any) {
      console.error("Error removing product:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to remove product.",
        variant: "destructive",
      });
    }
  };

  // Get product IDs that are already linked to this business
  const linkedProductIds = new Set(myProducts.map((bp) => bp.product_id));

  // Filter available products to exclude already linked ones
  const unlinkedProducts = availableProducts.filter(
    (p) => !linkedProductIds.has(p.id)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Business Registered</h3>
            <p className="text-muted-foreground">
              Please register your business first to manage products.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Products</h1>
        <p className="text-muted-foreground">
          Select products from the global catalog and customize them for your business
        </p>
      </div>

      {/* My Products Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          My Products ({myProducts.length})
        </h2>
        {myProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add products from the available catalog below to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProducts.map((bp) => (
              <Card key={bp.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {bp.product?.title || "Unknown Product"}
                  </CardTitle>
                  <CardDescription>
                    {bp.product?.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-semibold">
                        SCR {bp.price_override?.toFixed(2) || bp.product?.price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    {bp.quantity !== null && bp.quantity !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{bp.quantity}</span>
                      </div>
                    )}
                    {bp.location_note && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{bp.location_note}</span>
                      </div>
                    )}
                    {bp.best_buy_note && (
                      <div className="flex items-start gap-1 pt-1">
                        <Star className="w-3 h-3 text-yellow-500 mt-0.5" />
                        <span className="text-sm italic text-muted-foreground">
                          {bp.best_buy_note}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(bp)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(bp.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Products Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Available Products ({unlinkedProducts.length})
        </h2>
        {unlinkedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">All Products Added</h3>
              <p className="text-muted-foreground">
                You have added all available products to your business.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlinkedProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                  <CardDescription>{product.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Base Price:</span>
                    <span className="font-semibold">
                      SCR {product.price?.toFixed(2) || "N/A"}
                    </span>
                  </div>
                  <Button
                    onClick={() => openAddDialog(product)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to my business
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product to Business"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details for your business"
                : "Set your price, quantity, location, and best buy note for this product"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Read-only product info */}
            {selectedProduct && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <p className="font-semibold">{selectedProduct.title}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Base Price</Label>
                  <p className="font-medium">
                    SCR {selectedProduct.price?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Price (required) */}
            <div>
              <Label htmlFor="price_override">
                Your Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price_override"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_override}
                onChange={(e) =>
                  setFormData({ ...formData, price_override: e.target.value })
                }
                placeholder="Enter your price"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Quantity Available</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Number of units available"
              />
            </div>

            {/* Location Note */}
            <div>
              <Label htmlFor="location_note">Location Note</Label>
              <Input
                id="location_note"
                value={formData.location_note}
                onChange={(e) => setFormData({ ...formData, location_note: e.target.value })}
                placeholder="e.g., Beau Vallon, Mahé or La Digue only"
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Active products are visible to customers
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            {/* Best Buy Note */}
            <div>
              <Label htmlFor="best_buy_note">Best Buy Note</Label>
              <Textarea
                id="best_buy_note"
                value={formData.best_buy_note}
                onChange={(e) => setFormData({ ...formData, best_buy_note: e.target.value })}
                placeholder="Explain why your offer is special..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProductsPage;

