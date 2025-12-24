import React from "react";

export enum CursorVariant {
  DEFAULT = "DEFAULT",
  TEXT = "TEXT",
  VIEW = "VIEW",
  BUTTON = "BUTTON",
}

export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Partner {
  name: string;
  tag: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
}

// Global augmentation for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      shaderMaterial: any;
      group: any;
      directionalLight: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

// Augmentation for React 18+ JSX namespace
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      shaderMaterial: any;
      group: any;
      directionalLight: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}
