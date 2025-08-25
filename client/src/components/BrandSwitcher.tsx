import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Plus } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logo?: string | null;
  industry?: string | null;
  primaryColor?: string | null;
  isActive: boolean;
}

export default function BrandSwitcher() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) || brands[0];

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    // TODO: Update app context or store to reflect brand change
    // This would trigger re-fetching of brand-specific data
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-2 py-1">
        <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <Button variant="outline" className="justify-start h-auto p-2" data-testid="button-add-first-brand">
        <Building2 className="mr-2 h-4 w-4" />
        <span className="text-sm">Add First Brand</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-2"
          data-testid="button-brand-switcher"
        >
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={selectedBrand?.logo} alt={selectedBrand?.name} />
            <AvatarFallback 
              style={{ backgroundColor: selectedBrand?.primaryColor || '#0066cc' }}
              className="text-white text-xs"
            >
              {selectedBrand?.name?.charAt(0) || 'B'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div className="flex items-center space-x-2 w-full">
              <span className="text-sm font-medium truncate">
                {selectedBrand?.name || 'Select Brand'}
              </span>
              {selectedBrand?.industry && (
                <Badge variant="secondary" className="text-xs">
                  {selectedBrand.industry}
                </Badge>
              )}
            </div>
            {brands.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {brands.length} brands
              </span>
            )}
          </div>
          
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuLabel>Switch Brand</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => handleBrandSelect(brand.id)}
            className="flex items-center space-x-3 p-3"
            data-testid={`menu-item-brand-${brand.id}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={brand.logo} alt={brand.name} />
              <AvatarFallback 
                style={{ backgroundColor: brand.primaryColor || '#0066cc' }}
                className="text-white text-sm"
              >
                {brand.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-start flex-1">
              <div className="flex items-center space-x-2 w-full">
                <span className="font-medium">{brand.name}</span>
                {brand.id === selectedBrand?.id && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
                {!brand.isActive && (
                  <Badge variant="outline" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              {brand.industry && (
                <span className="text-xs text-muted-foreground">
                  {brand.industry}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center space-x-2" data-testid="menu-item-add-brand">
          <Plus className="h-4 w-4" />
          <span>Add New Brand</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}