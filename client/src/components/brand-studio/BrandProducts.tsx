import { useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/hooks/useBrand";
import type { BrandProduct } from "@shared/schema";

export default function BrandProducts() {
  const { isSpanish } = useLanguage();
  const { activeBrandId } = useBrand();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
  });

  const { data: products = [], isLoading } = useQuery<BrandProduct[]>({
    queryKey: ["/api/brands", activeBrandId, "products"],
    queryFn: () =>
      fetch(`/api/brands/${activeBrandId}/products`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!activeBrandId,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", `/api/brands/${activeBrandId}/products`, { ...data, brandId: activeBrandId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands", activeBrandId, "products"] });
      setForm({ name: "", description: "", image: "", price: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/brands/${activeBrandId}/products/${id}`, { brandId: activeBrandId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands", activeBrandId, "products"] });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    if (!form.name.trim() || !activeBrandId) return;
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
              <Label htmlFor="name">
                {isSpanish ? "Nombre del producto/servicio" : "Product/Service Name"}
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={isSpanish ? "Ej. Latte rosa signature" : "E.g. Signature pink latte"}
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">
                {isSpanish ? "Descripción" : "Description"}
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder={isSpanish ? "Describe el producto..." : "Describe the product..."}
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">
                {isSpanish ? "Precio (opcional)" : "Price (optional)"}
              </Label>
              <Input
                id="price"
                name="price"
                placeholder="$0.00"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">
                {isSpanish ? "URL de imagen (opcional)" : "Image URL (optional)"}
              </Label>
              <Input
                id="image"
                name="image"
                placeholder="https://example.com/product-image.jpg"
                value={form.image}
                onChange={handleChange}
              />
            </div>

            <div>
              <Button
                onClick={handleAddProduct}
                disabled={createMutation.isPending || !form.name.trim()}
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
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                {isSpanish ? "Aún no hay productos agregados." : "No products added yet."}
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
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.price && (
                            <span className="text-sm font-medium text-primary">{product.price}</span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(product.id)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
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
