/**
 * Business Product Assignments Component
 * 
 * Allows admins to manage product assignments for a business:
 * - List all existing product assignments
 * - Add new product assignments
 * - Remove assignments
 * - Edit price, duration, notes, active state
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  getBusinessProductAssignments,
  attachProductToBusiness,
  detachProductFromBusiness,
  updateBusinessProductAssignment,
  type BusinessProductWithJoin,
} from '@/lib/businessProducts';

interface BusinessProductAssignmentsProps {
  businessId: string;
}

const BusinessProductAssignments: React.FC<BusinessProductAssignmentsProps> = ({ businessId }) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<BusinessProductWithJoin[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state for adding new assignment
  const [newAssignment, setNewAssignment] = useState({
    product_id: '',
    price: '',
    duration: '',
    notes: '',
    active: true,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    price: '',
    duration: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  const loadData = async () => {
    if (!businessId) return;

    setLoading(true);
    setProductsError(null);
    try {
      // Load product assignments using the new helper
      const assignmentsData = await getBusinessProductAssignments(supabase, businessId);
      setAssignments(assignmentsData);

      // Load all available products for the assign dropdown
      const { data: allProducts, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          category,
          images,
          price,
          currency,
          stock,
          is_active,
          status,
          business_id,
          created_at,
          updated_at,
          slug
        `)
        .eq("is_active", true)
        .order("title");

      if (productsError) {
        console.error("[AdminPanel] Failed to load available products", {
          error: productsError,
          code: productsError.code,
          message: productsError.message,
          details: productsError.details,
          hint: productsError.hint,
          businessId
        });
        throw productsError;
      }

      setAvailableProducts(allProducts ?? []);
    } catch (err: any) {
      console.error("[AdminPanel] Failed to load product assignments", {
        error: err,
        code: err?.code,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        businessId,
        stack: err?.stack
      });
      const errorMessage = err?.message || "Failed to load product assignments";
      setProductsError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.product_id) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);
      const result = await attachProductToBusiness(
        supabase,
        businessId,
        newAssignment.product_id,
        {
          price: newAssignment.price ? parseFloat(newAssignment.price) : null,
          duration: newAssignment.duration || null,
          notes: newAssignment.notes || null,
          active: newAssignment.active,
        }
      );

      if (result) {
        toast({
          title: 'Success',
          description: 'Product assigned successfully',
        });
        setNewAssignment({
          product_id: '',
          price: '',
          duration: '',
          notes: '',
          active: true,
        });
        await loadData();
      } else {
        throw new Error('Failed to assign product');
      }
    } catch (error: any) {
      console.error("[AdminPanel] Error adding assignment:", {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        businessId,
        productId: newAssignment.product_id,
        stack: error?.stack
      });
      toast({
        title: 'Error',
        description: error?.message || 'Failed to assign product',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product assignment?')) {
      return;
    }

    try {
      const success = await detachProductFromBusiness(supabase, id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Product assignment removed',
        });
        await loadData();
      } else {
        throw new Error('Failed to remove assignment');
      }
    } catch (error: any) {
      console.error("[AdminPanel] Error deleting assignment:", {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        businessProductId: id,
        stack: error?.stack
      });
      toast({
        title: 'Error',
        description: error?.message || 'Failed to remove assignment',
        variant: 'destructive',
      });
    }
  };

  const handleStartEdit = (assignment: BusinessProductWithJoin) => {
    setEditingId(assignment.id);
    setEditForm({
      price: assignment.price?.toString() || '',
      duration: assignment.duration || '',
      notes: assignment.notes || '',
      active: assignment.active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      price: '',
      duration: '',
      notes: '',
      active: true,
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const result = await updateBusinessProductAssignment(
        supabase,
        id,
        {
          price: editForm.price ? parseFloat(editForm.price) : null,
          duration: editForm.duration || null,
          notes: editForm.notes || null,
          active: editForm.active,
        }
      );

      if (result) {
        toast({
          title: 'Success',
          description: 'Assignment updated successfully',
        });
        setEditingId(null);
        await loadData();
      } else {
        throw new Error('Failed to update assignment');
      }
    } catch (error: any) {
      console.error("[AdminPanel] Error updating assignment:", {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        businessProductId: id,
        editForm,
        stack: error?.stack
      });
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update assignment',
        variant: 'destructive',
      });
    }
  };

  // Get products not yet assigned
  const unassignedProducts = availableProducts.filter(
    product => !assignments.some(a => a.product_id === product.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Assigned Products
        </CardTitle>
        <CardDescription>
          Manage product assignments for this business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && productsError && (
          <div className="border border-destructive rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error loading product assignments</span>
            </div>
            <p className="text-sm text-muted-foreground">{productsError}</p>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Content - only show if not loading and no error */}
        {!loading && !productsError && (
          <>
        {/* Add New Assignment */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={newAssignment.product_id}
                onValueChange={(value) => setNewAssignment({ ...newAssignment, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (SCR)</Label>
              <Input
                type="number"
                value={newAssignment.price}
                onChange={(e) => setNewAssignment({ ...newAssignment, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                value={newAssignment.duration}
                onChange={(e) => setNewAssignment({ ...newAssignment, duration: e.target.value })}
                placeholder="e.g., 2 hours"
              />
            </div>
            <div className="space-y-2">
              <Label>Active</Label>
              <Select
                value={newAssignment.active.toString()}
                onValueChange={(value) => setNewAssignment({ ...newAssignment, active: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={newAssignment.notes}
              onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
              placeholder="Additional notes or conditions..."
              rows={2}
            />
          </div>
          <Button onClick={handleAddAssignment} disabled={adding || !newAssignment.product_id}>
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </>
            )}
          </Button>
        </div>

        {/* Existing Assignments */}
        <div className="space-y-4">
          <h3 className="font-semibold">Current Assignments ({assignments.length})</h3>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products assigned yet</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {editingId === assignment.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{assignment.products?.name || 'Unknown Product'}</h4>
                        <Badge variant={assignment.active ? 'default' : 'secondary'}>
                          {assignment.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Price (SCR)</Label>
                          <Input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            value={editForm.duration}
                            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Active</Label>
                          <Select
                            value={editForm.active.toString()}
                            onValueChange={(value) => setEditForm({ ...editForm, active: value === 'true' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(assignment.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{assignment.products?.name || 'Unknown Product'}</h4>
                          {assignment.products?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{assignment.products.description}</p>
                          )}
                        </div>
                        <Badge variant={assignment.active ? 'default' : 'secondary'}>
                          {assignment.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Base Price: </span>
                          <span className="font-medium">
                            {assignment.products?.base_price ? `SCR ${assignment.products.base_price}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Business Price: </span>
                          <span className="font-medium">
                            {assignment.price ? `SCR ${assignment.price}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Base Duration: </span>
                          <span className="font-medium">
                            {assignment.products?.base_duration || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Business Duration: </span>
                          <span className="font-medium">
                            {assignment.duration || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(assignment)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessProductAssignments;

