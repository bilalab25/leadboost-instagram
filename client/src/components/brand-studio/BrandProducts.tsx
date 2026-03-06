import { useState } from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Database,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type BrandProduct = {
  id: string;
  name: string;
  description: string;
  image?: string;
};

export default function BrandProducts() {
  const { isSpanish } = useLanguage();

  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = () => {
    if (!form.name.trim() || !form.description.trim()) return;

    const newProduct: BrandProduct = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim() || undefined,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setForm({
      name: "",
      description: "",
      image: "",
      price: 0,
    });
  };

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
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
                {isSpanish
                  ? "Nombre del producto/servicio"
                  : "Product/Service Name"}
              </Label>
              <Input
                id="name"
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
              <Label htmlFor="description">
                {isSpanish ? "Descripción" : "Description"}
              </Label>
              <Textarea
                id="description"
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
              <Label htmlFor="description">
                {isSpanish ? "Precio (opcional)" : "Price (optiona)"}
              </Label>
              <Input
                id="price"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">
                {isSpanish
                  ? "URL de imagen (opcional)"
                  : "Image URL (optional)"}
              </Label>
              <Input
                id="image"
                name="image"
                placeholder="https://example.com/product-image.jpg"
                value={form.image}
                onChange={handleChange}
              />

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="mt-3">
                  <Label
                    //htmlFor={`asset-upload-${category.value}`}
                    className="cursor-pointer"
                  >
                    <span className="font-medium text-brand-600 hover:text-brand-500">
                      {isSpanish ? "Subir recurso" : "Upload asset"}
                    </span>
                    <input
                      //id={`asset-upload-${category.value}`}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="sr-only"
                      //data-testid={`input-asset-upload-${category.value}`}
                    />
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {isSpanish ? "Imágenes o videos." : "Images or videos"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button
                onClick={handleAddProduct}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isSpanish ? "Agregar producto" : "Add Product"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {isSpanish ? "Productos agregados" : "Added Products"}
            </h3>

            {products.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                {isSpanish
                  ? "Aún no hay productos agregados."
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveProduct(product.id)}
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
