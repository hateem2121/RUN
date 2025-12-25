export enum MediaType {
  Image = "image",
  Video = "video",
  Model3D = "3d_model",
}

export interface Media {
  type: MediaType;
  src: string;
  thumbnail: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface Hotspot {
  id: string;
  position: string;
  normal: string;
  text: string;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  longDescription: string;
  media: Media[];
  availableColors: ProductColor[];
  hotspots?: Hotspot[];
  sizeChart: {
    [size: string]: {
      [measurement: string]: string;
    };
  };
  productSpecs: string[];
  minOrderQty: number;
  leadTime: string;
  customFit: string;
  customWeight: string;
  certifications: string[];
  productTags: string[];
  compatibleAccessories: RecommendedProduct[];
  detailImages: {
    src: string;
    alt: string;
  }[];
}
