import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabsContent } from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Database,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface BrandProduct {
  id: string;
  brandId: string;
  name: string;
  description: string | null;
  price: string | null;
  image: string | null;
  createdAt: string;
}

export default function BrandProducts() {
  const { isSpanish } = useLanguage();
  const { activeBrandId } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
  });

  const { data: products = [], isLoading } = useQuery<BrandProduct[]>({
    queryKey: ["/api/brand-products", activeBrandId],
    enabled: !!activeBrandId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/brand-products?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; price: string; image: string }) => {
      const res = await apiRequest("POST", `/api/brand-products?brandId=${activeBrandId}`, {
        name: data.name,
        description: data.description || null,
        price: data.price || null,
        image: data.image || null,
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-products", activeBrandId] });
      setForm({ name: "", description: "", image: "", price: "" });
      toast({
        title: isSpanish ? "Producto agregado" : "Product added",
      });
    },
    onError: () => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "No se pudo agregar el producto" : "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest("DELETE", `/api/brand-products/${productId}?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-products", activeBrandId] });
      toast({
        title: isSpanish ? "Producto eliminado" : "Product deleted",
      });
    },
    onError: () => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "No se pudo eliminar el producto" : "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <TabsContent value="products" className="space-y-6 mt-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            {isSpanish ? "Productos de la marca" : "Brand Products"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">
                {isSpanish
                  ? "Nombre del producto/servicio"
                  : "Product/Service Name"}
              </Label>
              <Input
                id="product-name"
                name="name"
                placeholder={
                  isSpanish
                    ? "Ej. Latte rosa signature"
                    : "E.g. Signature pink latte"
                }
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-description">
                {isSpanish ? "Descripcion" : "Description"}
              </Label>
              <Textarea
                id="product-description"
                name="description"
                placeholder={
                  isSpanish
                    ? "Describe el producto..."
                    : "Describe the product..."
                }
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-price">
                {isSpanish ? "Precio (opcional)" : "Price (optional)"}
              </Label>
              <Input
                id="product-price"
                name="price"
                placeholder={isSpanish ? "Ej. $12.99" : "E.g. $12.99"}
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-image">
                {isSpanish
                  ? "URL de imagen (opcional)"
                  : "Image URL (optional)"}
              </Label>
              <Input
                id="product-image"
                name="image"
                placeholder="https://..."
                value={form.image}
                onChange={handleChange}
              />
            </div>

            <div>
              <Button
                onClick={handleAddProduct}
                disabled={createMutation.isPending || !form.name.trim() || !form.description.trim()}
                className="flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isSpanish ? "Agregar producto" : "Add Product"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {isSpanish ? "Productos agregados" : "Added Products"}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                {isSpanish
                  ? "Aun no hay productos agregados."
                  : "No products added yet."}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image ? (
                      <div className="h-44 w-full bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        {product.price && (
                          <p className="text-sm font-medium text-brand-600 mt-0.5">
                            {product.price}
                          </p>
                        )}
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(product.id)}
                          className="flex items-center gap-2"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {isSpanish ? "Eliminar" : "Delete"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
